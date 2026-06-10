import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { requestSupabase } from './requestSupabase';
import { fetchSupabaseRows } from './fetchSupabaseRows';
import { fetchSupabaseSchema } from './fetchSupabaseSchema';
import { fetchSupabaseAuthUsers } from './fetchSupabaseAuthUsers';

type T_DeleteSupabaseRecordArgs =
    | {
        resource?: 'table-row';
        table: string;
        match: Record<string, any>;
      }
    | {
        resource: 'auth-user';
        userId: string;
        shouldSoftDelete?: boolean;
      };

export const deleteSupabaseRecord = (args: T_DeleteSupabaseRecordArgs): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            if (args.resource === 'auth-user') {
                await requestSupabase('/api/supabase', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        resource: 'auth-user',
                        userId: args.userId,
                        shouldSoftDelete: args.shouldSoftDelete,
                    }),
                });

                const supabase = getState()?.redux?.leida?.supabase || {};
                await dispatch(fetchSupabaseAuthUsers({
                    page: typeof supabase?.authPage === 'number' ? supabase.authPage : 1,
                    perPage: typeof supabase?.authPerPage === 'number' ? supabase.authPerPage : 25,
                }));
                await dispatch(fetchSupabaseSchema());
                return;
            }

            await requestSupabase('/api/supabase', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resource: 'table-row',
                    table: args.table,
                    match: args.match,
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