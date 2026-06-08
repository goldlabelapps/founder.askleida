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

export async function GET() {
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
		const data = await sql<{ table_name: string }[]>`
			select table_name
			from information_schema.tables
			where table_schema = 'public'
			  and table_type = 'BASE TABLE'
			order by table_name asc
		`;

		const res = makeRes({
			tenant,
			message: 'Fetched public schema tables',
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