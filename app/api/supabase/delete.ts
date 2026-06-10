import { NextResponse } from 'next/server';
import { makeRes } from '../';
import {
    assertAllowedAdminTable,
    createAdminClient,
    normalizeObject,
    parseJsonBody,
} from './lib/shared';

function applyMatch<T>(query: T, match: Record<string, any>) {
    let nextQuery: any = query;
    for (const [key, value] of Object.entries(match)) {
        nextQuery = nextQuery.eq(key, value);
    }
    return nextQuery;
}

export async function DELETE(req: Request) {
    try {
        const body = await parseJsonBody<Record<string, unknown>>(req);
        const resource = typeof body.resource === 'string' ? body.resource : 'table-row';
        const supabase = createAdminClient();

        if (resource === 'auth-user') {
            const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
            if (!userId) {
                const res = makeRes({ message: 'userId is required', severity: 'error', data: null });
                return NextResponse.json(res, { status: 400 });
            }

            const shouldSoftDelete = body.shouldSoftDelete !== false;
            const { data, error } = await supabase.auth.admin.deleteUser(userId, shouldSoftDelete);
            if (error) {
                throw new Error(error.message);
            }

            const res = makeRes({ message: `Deleted auth user ${userId}`, severity: 'success', data });
            return NextResponse.json(res);
        }

        const table = assertAllowedAdminTable(body.table);
        const match = normalizeObject(body.match, 'match');
        let query = supabase.from(table).delete().select('*');
        query = applyMatch(query, match);
        const { data, error } = await query;
        if (error) {
            throw new Error(error.message);
        }

        const res = makeRes({ message: `Deleted row in ${table}`, severity: 'success', data });
        return NextResponse.json(res);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete record';
        const res = makeRes({ message, severity: 'error', data: null });
        const status = message.includes('not allowed') ? 403 : 500;
        return NextResponse.json(res, { status });
    }
}