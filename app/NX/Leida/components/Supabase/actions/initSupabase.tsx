import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setSupabase } from './setSupabase';
import { fetchSupabaseSchema } from './fetchSupabaseSchema';
import { fetchSupabaseAuthUsers } from './fetchSupabaseAuthUsers';

export const initSupabase = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const current = getState()?.redux?.leida?.supabase || {};
            if (current?.initted) return;

            await dispatch(setSupabase('initted', true));
            await dispatch(fetchSupabaseSchema());
            await dispatch(fetchSupabaseAuthUsers({ page: 1, perPage: 25 }));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };