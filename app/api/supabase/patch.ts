import { NextResponse } from 'next/server';
import { makeRes } from '../';
import {
    assertAllowedAdminTable,
    createAdminClient,
    normalizeObject,
    normalizeOptionalObject,
    parseJsonBody,
} from './lib/shared';

function applyMatch<T>(query: T, match: Record<string, any>) {
    let nextQuery: any = query;
    for (const [key, value] of Object.entries(match)) {
        nextQuery = nextQuery.eq(key, value);
    }
    return nextQuery;
}

export async function PATCH(req: Request) {
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

            const attributes: Record<string, any> = {};
            if (typeof body.email === 'string' && body.email.trim()) attributes.email = body.email.trim();
            if (typeof body.password === 'string' && body.password.trim()) attributes.password = body.password;
            if (typeof body.phone === 'string') attributes.phone = body.phone.trim() || undefined;
            if (body.email_confirm === true) attributes.email_confirm = true;
            if (body.ban_duration && typeof body.ban_duration === 'string') attributes.ban_duration = body.ban_duration;
            const userMetadata = normalizeOptionalObject(body.user_metadata, 'user_metadata');
            const appMetadata = normalizeOptionalObject(body.app_metadata, 'app_metadata');
            if (userMetadata) attributes.user_metadata = userMetadata;
            if (appMetadata) attributes.app_metadata = appMetadata;

            const { data, error } = await supabase.auth.admin.updateUserById(userId, attributes);
            if (error) {
                throw new Error(error.message);
            }

            const res = makeRes({ message: `Updated auth user ${userId}`, severity: 'success', data: data.user });
            return NextResponse.json(res);
        }

        const table = assertAllowedAdminTable(body.table);
        const match = normalizeObject(body.match, 'match');
        const values = normalizeObject(body.values, 'values');
        let query = supabase.from(table).update(values).select('*');
        query = applyMatch(query, match);
        const { data, error } = await query;
        if (error) {
            throw new Error(error.message);
        }

        const res = makeRes({ message: `Updated row in ${table}`, severity: 'success', data });
        return NextResponse.json(res);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update record';
        const res = makeRes({ message, severity: 'error', data: null });
        const status = message.includes('not allowed') ? 403 : 500;
        return NextResponse.json(res, { status });
    }
}