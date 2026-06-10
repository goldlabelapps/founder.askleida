import { NextResponse } from 'next/server';
import { makeRes } from '../';
import {
    assertAllowedAdminTable,
    createAdminClient,
    createSqlClient,
    ensurePublicTable,
    getTableSchema,
    parseInteger,
    tenant,
    toNumber,
} from './lib/shared';

async function getAuthDiagnostics() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

        if (error) {
            throw error;
        }

        return {
            available: true,
            user_count: toNumber(data?.total),
            latest_signup: data?.users?.[0]?.created_at || null,
        };
    } catch (error) {
        return {
            available: false,
            error: error instanceof Error ? error.message : 'Failed to fetch auth diagnostics',
        };
    }
}

async function handleSchema(req: Request) {
    let sql;
    try {
        sql = createSqlClient();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid database URL';
        const res = makeRes({ message, severity: 'error', data: null });
        return NextResponse.json(res, { status: 500 });
    }

    try {
        const url = req?.url ? new URL(req.url) : null;
        const includeExactCounts = url?.searchParams.get('exactCounts') === 'true';
        const data = await getTableSchema(sql, undefined, includeExactCounts);
        const auth = await getAuthDiagnostics();
        const res = makeRes({
            message: includeExactCounts
                ? 'Fetched public schema diagnostics with exact row counts'
                : 'Fetched public schema diagnostics',
            severity: 'success',
            data: {
                ...data,
                auth,
            },
        });
        return NextResponse.json(res);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch public schema tables';
        const res = makeRes({ message, severity: 'error', data: null });
        return NextResponse.json(res, { status: 500 });
    } finally {
        await sql.end();
    }
}

async function handleRows(req: Request) {
    const url = req?.url ? new URL(req.url) : null;
    const table = url?.searchParams.get('table');
    const limit = parseInteger(url?.searchParams.get('limit') || null, 25, { min: 1, max: 100 });
    const offset = parseInteger(url?.searchParams.get('offset') || null, 0, { min: 0, max: 10000 });

    if (!table) {
        const res = makeRes({ message: 'table is required for rows view', severity: 'error', data: null });
        return NextResponse.json(res, { status: 400 });
    }

    let sql;
    try {
        sql = createSqlClient();
        const safeTable = assertAllowedAdminTable(table);
        await ensurePublicTable(sql, safeTable);
        const schema = await getTableSchema(sql, safeTable, false);
        const tableSchema = schema.tables?.[0] || null;

        const supabase = createAdminClient();
        let query = supabase.from(safeTable).select('*', { count: 'exact' });
        const primaryKeys = Array.isArray(tableSchema?.primary_keys) ? tableSchema.primary_keys : [];
        if (primaryKeys.length === 1) {
            query = query.order(primaryKeys[0], { ascending: true });
        }

        const { data, count, error } = await query.range(offset, offset + limit - 1);
        if (error) {
            throw new Error(error.message);
        }

        const res = makeRes({
            message: `Fetched rows for ${safeTable}`,
            severity: 'success',
            data: {
                table: safeTable,
                limit,
                offset,
                count: toNumber(count),
                rows: Array.isArray(data) ? data : [],
                columns: tableSchema?.columns || [],
                primary_keys: primaryKeys,
            },
        });
        return NextResponse.json(res);
    } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to fetch rows for ${table}`;
        const res = makeRes({ message, severity: 'error', data: null });
        const status = message.includes('not allowed') ? 403 : 500;
        return NextResponse.json(res, { status });
    } finally {
        if (sql) {
            await sql.end();
        }
    }
}

async function handleAuthUsers(req: Request) {
    const url = req?.url ? new URL(req.url) : null;
    const page = parseInteger(url?.searchParams.get('page') || null, 1, { min: 1, max: 1000 });
    const perPage = parseInteger(url?.searchParams.get('perPage') || null, 25, { min: 1, max: 100 });

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

        if (error) {
            throw new Error(error.message);
        }

        const users = Array.isArray(data?.users)
            ? data.users.map((user) => ({
                id: user.id,
                email: user.email || null,
                role: user.role || null,
                created_at: user.created_at || null,
                last_sign_in_at: user.last_sign_in_at || null,
                email_confirmed_at: user.email_confirmed_at || null,
                phone: user.phone || null,
                app_metadata: user.app_metadata || {},
                user_metadata: user.user_metadata || {},
                identities: Array.isArray(user.identities) ? user.identities : [],
            }))
            : [];

        const res = makeRes({
            message: 'Fetched auth users',
            severity: 'success',
            data: {
                page,
                perPage,
                total: toNumber(data?.total),
                users,
            },
        });
        return NextResponse.json(res);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch auth users';
        const res = makeRes({ message, severity: 'error', data: null });
        return NextResponse.json(res, { status: 500 });
    }
}

export async function GET(req: Request) {
    const url = req?.url ? new URL(req.url) : null;
    const view = url?.searchParams.get('view') || 'schema';

    switch (view) {
        case 'rows':
            return handleRows(req);
        case 'auth-users':
            return handleAuthUsers(req);
        case 'schema':
        default:
            return handleSchema(req);
    }
}