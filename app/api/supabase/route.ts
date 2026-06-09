import { NextResponse } from 'next/server';
import { makeRes } from '../';
import postgres from 'postgres';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const tenant = process.env.NEXT_PUBLIC_TENANT;
const databaseUrl =
	process.env.DATABASE_URL ||
	process.env.POSTGRES_URL ||
	process.env.SUPABASE_DB_URL;

const normalizedDatabaseUrl = databaseUrl?.trim();

type TableRow = { table_name: string };
type ColumnRow = {
	table_name: string;
	column_name: string;
	data_type: string;
	udt_name: string;
	is_nullable: 'YES' | 'NO';
	column_default: string | null;
};
type EstimateRow = { table_name: string; estimated_rows: number | string | null };
type ConstraintRow = {
	table_name: string;
	column_name: string;
	constraint_type: string;
	constraint_name: string;
};

const quoteIdent = (value: string) => `"${value.replace(/"/g, '""')}"`;
const quoteLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;

const toNumber = (value: number | string | null | undefined): number => {
	if (typeof value === 'number') return value;
	if (typeof value === 'string') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
};

async function getAuthDiagnostics(sql: postgres.Sql) {
	try {
		const [exists] = await sql<{
			users_regclass: string | null;
			identities_regclass: string | null;
		}[]>`
			select
				to_regclass('auth.users')::text as users_regclass,
				to_regclass('auth.identities')::text as identities_regclass
		`;

		if (!exists?.users_regclass) {
			return {
				available: false,
				note: 'Supabase Auth tables are not visible to this database role.',
			};
		}

		const [userStats] = await sql<{
			user_count: number | string;
			latest_signup: string | null;
		}[]>`
			select
				count(*)::bigint as user_count,
				max(created_at)::text as latest_signup
			from auth.users
		`;

		let providers: Array<{ provider: string; identities: number }> = [];
		if (exists.identities_regclass) {
			const providerRows = await sql<{ provider: string; identities: number | string }[]>`
				select
					provider,
					count(*)::bigint as identities
				from auth.identities
				group by provider
				order by identities desc
			`;

			providers = providerRows.map((row) => ({
				provider: row.provider,
				identities: toNumber(row.identities),
			}));
		}

		return {
			available: true,
			user_count: toNumber(userStats?.user_count),
			latest_signup: userStats?.latest_signup || null,
			providers,
		};
	} catch (error) {
		return {
			available: false,
			error: error instanceof Error ? error.message : 'Failed to query auth diagnostics',
		};
	}
}

export async function GET(req: Request) {
	if (!normalizedDatabaseUrl) {
		const res = makeRes({
			tenant,
			message: 'Missing database connection string for Supabase tables lookup. Set DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL.',
			severity: 'error',
		});
		return NextResponse.json(res, { status: 500 });
	}

	let sql;
	try {
		sql = postgres(normalizedDatabaseUrl, { prepare: false });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Invalid database URL';
		const res = makeRes({ tenant, message: `Invalid database URL: ${message}`, severity: 'error' });
		return NextResponse.json(res, { status: 500 });
	}

	try {
		const url = req?.url ? new URL(req.url) : null;
		const includeExactCounts = url?.searchParams.get('exactCounts') === 'true';

		const [databaseInfoRows, tableRows, columnRows, estimateRows, constraintRows] = await Promise.all([
			sql<{ database_name: string; database_user: string; postgres_version: string }[]>`
				select
					current_database()::text as database_name,
					current_user::text as database_user,
					version()::text as postgres_version
			`,
			sql<TableRow[]>`
				select table_name
				from information_schema.tables
				where table_schema = 'public'
				  and table_type = 'BASE TABLE'
				order by table_name asc
			`,
			sql<ColumnRow[]>`
				select
					table_name,
					column_name,
					data_type,
					udt_name,
					is_nullable,
					column_default
				from information_schema.columns
				where table_schema = 'public'
				order by table_name asc, ordinal_position asc
			`,
			sql<EstimateRow[]>`
				select
					c.relname::text as table_name,
					c.reltuples::bigint as estimated_rows
				from pg_class c
				join pg_namespace n on n.oid = c.relnamespace
				where n.nspname = 'public'
				  and c.relkind = 'r'
				order by c.relname asc
			`,
			sql<ConstraintRow[]>`
				select
					kcu.table_name,
					kcu.column_name,
					tc.constraint_type,
					tc.constraint_name
				from information_schema.table_constraints tc
				join information_schema.key_column_usage kcu
				  on tc.constraint_name = kcu.constraint_name
				 and tc.table_schema = kcu.table_schema
				where tc.table_schema = 'public'
				  and tc.constraint_type in ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
				order by kcu.table_name asc, kcu.ordinal_position asc
			`,
		]);

		const auth = await getAuthDiagnostics(sql);

		const columnsByTable = new Map<string, Array<{
			name: string;
			data_type: string;
			udt_name: string;
			nullable: boolean;
			default: string | null;
		}>>();
		for (const row of columnRows) {
			const list = columnsByTable.get(row.table_name) || [];
			list.push({
				name: row.column_name,
				data_type: row.data_type,
				udt_name: row.udt_name,
				nullable: row.is_nullable === 'YES',
				default: row.column_default,
			});
			columnsByTable.set(row.table_name, list);
		}

		const estimatesByTable = new Map<string, number>();
		for (const row of estimateRows) {
			estimatesByTable.set(row.table_name, toNumber(row.estimated_rows));
		}

		const constraintsByTable = new Map<string, Array<{
			column_name: string;
			constraint_type: string;
			constraint_name: string;
		}>>();
		for (const row of constraintRows) {
			const list = constraintsByTable.get(row.table_name) || [];
			list.push({
				column_name: row.column_name,
				constraint_type: row.constraint_type,
				constraint_name: row.constraint_name,
			});
			constraintsByTable.set(row.table_name, list);
		}

		const exactCountsByTable = new Map<string, number>();
		if (includeExactCounts && tableRows.length > 0) {
			const countSql = tableRows
				.map((row) => (
					`select ${quoteLiteral(row.table_name)} as table_name, count(*)::bigint as exact_rows from ${quoteIdent(row.table_name)}`
				))
				.join(' union all ');

			const exactRows = await sql.unsafe<{ table_name: string; exact_rows: number | string }[]>(countSql);
			for (const row of exactRows) {
				exactCountsByTable.set(row.table_name, toNumber(row.exact_rows));
			}
		}

		const tables = tableRows.map((table) => ({
			table_name: table.table_name,
			estimated_rows: estimatesByTable.get(table.table_name) || 0,
			exact_rows: includeExactCounts ? (exactCountsByTable.get(table.table_name) || 0) : undefined,
			columns: columnsByTable.get(table.table_name) || [],
			constraints: constraintsByTable.get(table.table_name) || [],
		}));

		const databaseInfo = databaseInfoRows?.[0] || null;
		const data = {
			database: {
				name: databaseInfo?.database_name || null,
				user: databaseInfo?.database_user || null,
				postgres_version: databaseInfo?.postgres_version || null,
			},
			schema: 'public',
			table_count: tables.length,
			include_exact_counts: includeExactCounts,
			tables,
			auth,
		};

		const message = includeExactCounts
			? 'Fetched public schema diagnostics with exact row counts'
			: 'Fetched public schema diagnostics';

		const res = makeRes({
			tenant,
			message,
			severity: 'success',
			data,
		});
		return NextResponse.json(res);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch public schema tables';
		const res = makeRes({ tenant, message, severity: 'error' });
		return NextResponse.json(res, { status: 500 });
	} finally {
		await sql.end();
	}
}