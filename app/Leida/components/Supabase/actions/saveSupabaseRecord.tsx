import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { requestSupabase } from './requestSupabase';
import { fetchSupabaseRows } from './fetchSupabaseRows';
import { fetchSupabaseSchema } from './fetchSupabaseSchema';
import { fetchSupabaseAuthUsers } from './fetchSupabaseAuthUsers';

type T_SaveSupabaseRecordArgs =
    | {
        resource?: 'table-row';
        table: string;
        values: Record<string, any>;
        match?: Record<string, any>;
      }
    | {
        resource: 'auth-user';
        userId?: string;
        email: string;
        password?: string;
        phone?: string;
        email_confirm?: boolean;
        user_metadata?: Record<string, any>;
        app_metadata?: Record<string, any>;
            }
        | {
                resource: 'practitioner-onboard';
                email: string;
                redirectTo?: string;
                user_metadata?: Record<string, any>;
      };

export const saveSupabaseRecord = (args: T_SaveSupabaseRecordArgs): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            if (args.resource === 'practitioner-onboard') {
                const user_metadata = {
                    onboarded: false,
                    avatar: 'https://app.askleida.com/shared/svg/guest.svg',
                    ...args.user_metadata,
                };
                const data = await requestSupabase<{ user?: Record<string, any>; practitioner?: Record<string, any> }>('/api/supabase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        resource: 'practitioner-onboard',
                        email: args.email,
                        redirectTo: 'https://app.askleida.com/account/invite',
                        user_metadata,
                    }),
                });

                const supabase = getState()?.redux?.leida?.supabase || {};
                await dispatch(fetchSupabaseAuthUsers({
                    page: 1,
                    perPage: typeof supabase?.authPerPage === 'number' ? supabase.authPerPage : 10,
                }));
                await dispatch(fetchSupabaseSchema());
                return data;
            }

            if (args.resource === 'auth-user') {
                const method = args.userId ? 'PATCH' : 'POST';
                await requestSupabase('/api/supabase', {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        resource: 'auth-user',
                        userId: args.userId,
                        email: args.email,
                        password: args.password,
                        phone: args.phone,
                        send_invite: !args.userId,
                        email_confirm: args.email_confirm,
                        user_metadata: args.user_metadata,
                        app_metadata: args.app_metadata,
                    }),
                });

                const supabase = getState()?.redux?.leida?.supabase || {};
                await dispatch(fetchSupabaseAuthUsers({
                    page: typeof supabase?.authPage === 'number' ? supabase.authPage : 1,
                    perPage: typeof supabase?.authPerPage === 'number' ? supabase.authPerPage : 10,
                }));
                await dispatch(fetchSupabaseSchema());
                return;
            }

            const method = args.match ? 'PATCH' : 'POST';
            await requestSupabase('/api/supabase', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resource: 'table-row',
                    table: args.table,
                    match: args.match,
                    values: args.values,
                }),
            });

            const rowsState = getState()?.redux?.leida?.supabase?.rowsByTable?.[args.table] || {};
            await dispatch(fetchSupabaseRows({
                table: args.table,
                limit: typeof rowsState?.limit === 'number' ? rowsState.limit : 25,
                offset: typeof rowsState?.offset === 'number' ? rowsState.offset : 0,
            }));
            await dispatch(fetchSupabaseSchema());
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
            throw e;
        }
    };