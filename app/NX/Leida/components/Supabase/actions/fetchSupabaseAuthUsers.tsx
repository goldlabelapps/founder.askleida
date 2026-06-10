import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setSupabase } from './setSupabase';
import { requestSupabase } from './requestSupabase';
import type { T_SupabaseAuthUser } from '../types';

type T_FetchSupabaseAuthUsersArgs = {
    page?: number;
    perPage?: number;
};

type T_AuthUsersResponse = {
    page?: number;
    perPage?: number;
    total?: number;
    users?: T_SupabaseAuthUser[];
};

export const fetchSupabaseAuthUsers = ({ page = 1, perPage = 25 }: T_FetchSupabaseAuthUsersArgs = {}): any =>
    async (dispatch: Dispatch) => {
        try {
            await dispatch(setSupabase('authLoading', true));
            await dispatch(setSupabase('authError', null));
            const params = new URLSearchParams({
                view: 'auth-users',
                page: String(page),
                perPage: String(perPage),
            });
            const data = await requestSupabase<T_AuthUsersResponse>(`/api/supabase?${params.toString()}`);
            await dispatch(setSupabase('authUsers', Array.isArray(data?.users) ? data.users : []));
            await dispatch(setSupabase('authPage', typeof data?.page === 'number' ? data.page : page));
            await dispatch(setSupabase('authPerPage', typeof data?.perPage === 'number' ? data.perPage : perPage));
            await dispatch(setSupabase('authTotal', typeof data?.total === 'number' ? data.total : 0));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            await dispatch(setSupabase('authError', msg));
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        } finally {
            await dispatch(setSupabase('authLoading', false));
        }
    };