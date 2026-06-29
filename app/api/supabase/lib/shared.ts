import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

export const tenant = process.env.NEXT_PUBLIC_TENANT;
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL;

const TABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const DEFAULT_ADMIN_TABLE_ALLOWLIST = [
    'products',
    'practitioners',
    'awin_feed_snapshots',
    'products_awin',
    'awin_lookfantastic',
];

type T_AllowlistConfig = {
    tables: string[];
    source: 'env' | 'default';
};

export type T_TableRow = { table_name: string };
export type T_ColumnRow = {
    table_name: string;
    column_name: string;
    data_type: string;
    udt_name: string;
    is_nullable: 'YES' | 'NO';
    column_default: string | null;
};
export type T_EstimateRow = { table_name: string; estimated_rows: number | string | null };
export type T_ConstraintRow = {
    table_name: string;
    column_name: string;
    constraint_type: string;
    constraint_name: string;
};

export function quoteIdent(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
}

export function quoteLiteral(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

export function toNumber(value: number | string | null | undefined): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

export function parseInteger(value: string | null, fallback: number, options?: { min?: number; max?: number }): number {
    const parsed = value ? Number(value) : fallback;
    if (!Number.isFinite(parsed)) return fallback;
    const floored = Math.floor(parsed);
    const min = options?.min ?? floored;
    const max = options?.max ?? floored;
    return Math.min(Math.max(floored, min), max);
}

export function assertSafeTableName(value: unknown): string {
    if (typeof value !== 'string') {
        throw new Error('table is required');
    }

    const trimmed = value.trim();
    if (!trimmed || !TABLE_NAME_PATTERN.test(trimmed)) {
        throw new Error('Invalid table name');
    }

    return trimmed;
}

export function getAdminTableAllowlist(): string[] {
    return getAdminTableAllowlistConfig().tables;
}

export function getAdminTableAllowlistConfig(): T_AllowlistConfig {
    const envValue = process.env.SUPABASE_ADMIN_TABLE_ALLOWLIST || '';
    const parsed = envValue
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .filter((item) => TABLE_NAME_PATTERN.test(item));

    if (parsed.length > 0) {
        return {
            tables: Array.from(new Set(parsed)),
            source: 'env',
        };
    }

    return {
        tables: DEFAULT_ADMIN_TABLE_ALLOWLIST,
        source: 'default',
    };
}

export function assertAllowedAdminTable(value: unknown): string {
    const tableName = assertSafeTableName(value);
    const { tables: allowlist } = getAdminTableAllowlistConfig();

    if (!allowlist.includes(tableName)) {
        throw new Error(`Table ${tableName} is not allowed. Allowed tables: ${allowlist.join(', ')}`);
    }

    return tableName;
}

export function filterAllowedTables<T extends { table_name?: string }>(tables: T[]): T[] {
    const { tables: allowlist } = getAdminTableAllowlistConfig();
    return tables.filter((table) => typeof table?.table_name === 'string' && allowlist.includes(table.table_name));
}

export function normalizeObject(value: unknown, label: string): Record<string, any> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`${label} must be a JSON object`);
    }

    return value as Record<string, any>;
}

export function normalizeOptionalObject(value: unknown, label: string): Record<string, any> | undefined {
    if (value === undefined || value === null) return undefined;
    return normalizeObject(value, label);
}

export async function parseJsonBody<T>(req: Request): Promise<T> {
    try {
        return await req.json();
    } catch {
        throw new Error('Invalid JSON body');
    }
}

export function createAdminClient() {
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export function createSqlClient() {
    const normalizedDatabaseUrl = databaseUrl?.trim();
    if (!normalizedDatabaseUrl) {
        throw new Error('Missing database connection string for Supabase tables lookup. Set DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL.');
    }

    return postgres(normalizedDatabaseUrl, { prepare: false });
}

export async function ensurePublicTable(sql: postgres.Sql, tableName: string) {
    const safeTableName = assertSafeTableName(tableName);
    const rows = await sql<{ table_name: string }[]>`
        select table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_type = 'BASE TABLE'
          and table_name = ${safeTableName}
        limit 1
    `;

    if (!rows.length) {
        throw new Error(`Unknown public table: ${safeTableName}`);
    }

    return safeTableName;
}

export async function getTableSchema(sql: postgres.Sql, tableName?: string, includeExactCounts = false) {
    const safeTableName = tableName ? assertSafeTableName(tableName) : null;
    const maybeFilter = safeTableName
        ? sql`and table_name = ${safeTableName}`
        : sql``;

    const maybeConstraintFilter = safeTableName
        ? sql`and kcu.table_name = ${safeTableName}`
        : sql``;

    const [databaseInfoRows, tableRows, columnRows, estimateRows, constraintRows] = await Promise.all([
        sql<{ database_name: string; database_user: string; postgres_version: string }[]>`
            select
                current_database()::text as database_name,
                current_user::text as database_user,
                version()::text as postgres_version
        `,
        sql<T_TableRow[]>`
            select table_name
            from information_schema.tables
            where table_schema = 'public'
              and table_type = 'BASE TABLE'
              ${maybeFilter}
            order by table_name asc
        `,
        sql<T_ColumnRow[]>`
            select
                table_name,
                column_name,
                data_type,
                udt_name,
                is_nullable,
                column_default
            from information_schema.columns
            where table_schema = 'public'
              ${maybeFilter}
            order by table_name asc, ordinal_position asc
        `,
        sql<T_EstimateRow[]>`
            select
                c.relname::text as table_name,
                c.reltuples::bigint as estimated_rows
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public'
              and c.relkind = 'r'
              ${safeTableName ? sql`and c.relname = ${safeTableName}` : sql``}
            order by c.relname asc
        `,
        sql<T_ConstraintRow[]>`
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
              ${maybeConstraintFilter}
            order by kcu.table_name asc, kcu.ordinal_position asc
        `,
    ]);

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
    const primaryKeysByTable = new Map<string, string[]>();

    for (const row of constraintRows) {
        const list = constraintsByTable.get(row.table_name) || [];
        list.push({
            column_name: row.column_name,
            constraint_type: row.constraint_type,
            constraint_name: row.constraint_name,
        });
        constraintsByTable.set(row.table_name, list);

        if (row.constraint_type === 'PRIMARY KEY') {
            const keys = primaryKeysByTable.get(row.table_name) || [];
            keys.push(row.column_name);
            primaryKeysByTable.set(row.table_name, keys);
        }
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

    const allowlist = getAdminTableAllowlistConfig();

    const tables = tableRows.map((table) => ({
        table_name: table.table_name,
        estimated_rows: estimatesByTable.get(table.table_name) || 0,
        exact_rows: includeExactCounts ? (exactCountsByTable.get(table.table_name) || 0) : undefined,
        columns: columnsByTable.get(table.table_name) || [],
        constraints: constraintsByTable.get(table.table_name) || [],
        primary_keys: primaryKeysByTable.get(table.table_name) || [],
        crud_allowed: allowlist.tables.includes(table.table_name),
    }));

    const databaseInfo = databaseInfoRows?.[0] || null;

    return {
        database: {
            name: databaseInfo?.database_name || null,
            user: databaseInfo?.database_user || null,
            postgres_version: databaseInfo?.postgres_version || null,
        },
        schema: 'public',
        table_count: tables.length,
        include_exact_counts: includeExactCounts,
        crud_allowed_tables: allowlist.tables,
        crud_allowlist_source: allowlist.source,
        tables,
    };
}