import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setSupabase } from './setSupabase';
import { requestSupabase } from './requestSupabase';

type T_FetchSupabaseRowsArgs = {
    table: string;
    limit?: number;
    offset?: number;
};

type T_RowsResponse = {
    table?: string;
    rows?: Record<string, any>[];
    count?: number;
    limit?: number;
    offset?: number;
    columns?: any[];
    primary_keys?: string[];
};

export const fetchSupabaseRows = ({ table, limit = 25, offset = 0 }: T_FetchSupabaseRowsArgs): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        const current = getState()?.redux?.leida?.supabase || {};
        const rowsByTable = current?.rowsByTable || {};
        const existing = rowsByTable?.[table] || {};

        try {
            await dispatch(setSupabase('rowsByTable', {
                ...rowsByTable,
                [table]: {
                    ...existing,
                    loading: true,
                    error: null,
                    limit,
                    offset,
                },
            }));

            const params = new URLSearchParams({
                view: 'rows',
                table,
                limit: String(limit),
                offset: String(offset),
            });
            const data = await requestSupabase<T_RowsResponse>(`/api/supabase?${params.toString()}`);
            const latestRowsByTable = getState()?.redux?.leida?.supabase?.rowsByTable || {};

            await dispatch(setSupabase('rowsByTable', {
                ...latestRowsByTable,
                [table]: {
                    loading: false,
                    error: null,
                    rows: Array.isArray(data?.rows) ? data.rows : [],
                    count: typeof data?.count === 'number' ? data.count : 0,
                    limit,
                    offset,
                    columns: Array.isArray(data?.columns) ? data.columns : [],
                    primaryKeys: Array.isArray(data?.primary_keys) ? data.primary_keys : [],
                },
            }));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            const latestRowsByTable = getState()?.redux?.leida?.supabase?.rowsByTable || {};
            const latestExisting = latestRowsByTable?.[table] || {};
            await dispatch(setSupabase('rowsByTable', {
                ...latestRowsByTable,
                [table]: {
                    ...latestExisting,
                    loading: false,
                    error: msg,
                },
            }));
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };