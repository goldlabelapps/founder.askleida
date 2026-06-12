import { NextResponse } from 'next/server';
import { makeRes } from '../';
import {
    assertAllowedAdminTable,
    createAdminClient,
    normalizeObject,
    normalizeOptionalObject,
    parseJsonBody,
} from './lib/shared';

function makeInviteRedirectUrl(baseUrl?: string) {
    if (!baseUrl) {
        return undefined;
    }

    try {
        return new URL('/invite', baseUrl).toString();
    } catch {
        return `${baseUrl.replace(/\/$/, '')}/invite`;
    }
}

export async function POST(req: Request) {
    try {
        const body = await parseJsonBody<Record<string, unknown>>(req);
        const resource = typeof body.resource === 'string' ? body.resource : 'table-row';
        const supabase = createAdminClient();

        if (resource === 'practitioner-onboard') {
            const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
            if (!email) {
                const res = makeRes({ message: 'email is required', severity: 'error', data: null });
                return NextResponse.json(res, { status: 400 });
            }

            const defaultRedirect = makeInviteRedirectUrl(
                process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || undefined,
            );
            const redirectTo = typeof body.redirectTo === 'string' && body.redirectTo.trim()
                ? body.redirectTo.trim()
                : defaultRedirect;

            const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
                data: normalizeOptionalObject(body.user_metadata, 'user_metadata') || {},
                ...(redirectTo ? { redirectTo } : {}),
            });

            if (inviteError) {
                const message = inviteError.message || 'Failed to invite user';
                const isDuplicate = /already|exists|registered|taken/i.test(message);
                const res = makeRes({ message, severity: 'error', data: null });
                return NextResponse.json(res, { status: isDuplicate ? 409 : 500 });
            }

            const invitedUser = inviteData?.user;
            const practitionerId = invitedUser?.id;
            if (!practitionerId) {
                throw new Error('Invite succeeded but no user id was returned');
            }

            const localPart = email.split('@')[0] || email;
            const displayName = localPart
                .split(/[._-]+/)
                .filter(Boolean)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ') || email;

                
            const placeholderData = {
                display_name: displayName,
                onboarding: {
                    status: 'invited',
                    invited_email: email,
                    invited_at: new Date().toISOString(),
                },
                profile: {
                    name: displayName,
                    category: null,
                    description: 'Practitioner invited via Supabase onboarding flow.',
                },
                flags: {
                    practitioner_id_matches_uid: true,
                },
            };

            const { data: practitionerData, error: practitionerError } = await supabase
                .from('practitioners')
                .insert([{
                    practitioner_id: practitionerId,
                    title: email,
                    data: placeholderData,
                }])
                .select('*')
                .single();

            if (practitionerError) {
                await supabase.auth.admin.deleteUser(practitionerId).catch(() => undefined);
                throw new Error(`Invited auth user but failed to create practitioner record: ${practitionerError.message}`);
            }

            const res = makeRes({
                message: `Invited ${email} and created practitioner record`,
                severity: 'success',
                data: {
                    user: invitedUser,
                    practitioner: practitionerData,
                },
            });
            return NextResponse.json(res);
        }

        if (resource === 'auth-user') {
            const email = typeof body.email === 'string' ? body.email.trim() : '';
            if (!email) {
                const res = makeRes({ message: 'email is required', severity: 'error', data: null });
                return NextResponse.json(res, { status: 400 });
            }

            const shouldInvite = body.send_invite === true;
            if (shouldInvite) {
                const redirectTo = typeof body.redirectTo === 'string' && body.redirectTo.trim()
                    ? body.redirectTo.trim()
                    : makeInviteRedirectUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || undefined);

                const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
                    data: normalizeOptionalObject(body.user_metadata, 'user_metadata') || {},
                    ...(redirectTo ? { redirectTo } : {}),
                });

                if (error) {
                    const message = error.message || 'Failed to invite user';
                    const isDuplicate = /already|exists|registered|taken/i.test(message);
                    const res = makeRes({ message, severity: 'error', data: null });
                    return NextResponse.json(res, { status: isDuplicate ? 409 : 500 });
                }

                const res = makeRes({ message: `Invited auth user ${email}`, severity: 'success', data: data?.user || null });
                return NextResponse.json(res);
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