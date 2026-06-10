import { NextResponse } from 'next/server';
import { makeRes } from '../';
import {
    assertAllowedAdminTable,
    createAdminClient,
    normalizeObject,
    normalizeOptionalObject,
    parseJsonBody,
} from './lib/shared';

export async function POST(req: Request) {
    try {
        const body = await parseJsonBody<Record<string, unknown>>(req);
        const resource = typeof body.resource === 'string' ? body.resource : 'table-row';
        const supabase = createAdminClient();

        if (resource === 'auth-user') {
            const email = typeof body.email === 'string' ? body.email.trim() : '';
            if (!email) {
                const res = makeRes({ message: 'email is required', severity: 'error', data: null });
                return NextResponse.json(res, { status: 400 });
            }

            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password: typeof body.password === 'string' && body.password.trim() ? body.password : undefined,
                email_confirm: body.email_confirm === true,
                user_metadata: normalizeOptionalObject(body.user_metadata, 'user_metadata'),
                app_metadata: normalizeOptionalObject(body.app_metadata, 'app_metadata'),
            });

            if (error) {
                throw new Error(error.message);
            }

            const res = makeRes({ message: `Created auth user ${email}`, severity: 'success', data: data.user });
            return NextResponse.json(res);
        }

        const table = assertAllowedAdminTable(body.table);
        const values = normalizeObject(body.values, 'values');
        const { data, error } = await supabase.from(table).insert([values]).select('*');
        if (error) {
            throw new Error(error.message);
        }

        const res = makeRes({ message: `Created row in ${table}`, severity: 'success', data });
        return NextResponse.json(res);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create record';
        const res = makeRes({ message, severity: 'error', data: null });
        const status = message.includes('not allowed') ? 403 : 500;
        return NextResponse.json(res, { status });
    }
}