import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setSupabase } from './setSupabase';
import { requestSupabase } from './requestSupabase';
import type { T_SupabaseSchemaData } from '../types';

export const fetchSupabaseSchema = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            await dispatch(setSupabase('schemaLoading', true));
            await dispatch(setSupabase('schemaError', null));
            const data = await requestSupabase<T_SupabaseSchemaData>('/api/supabase');
            const current = getState()?.redux?.leida?.supabase || {};
            const availableTables = Array.isArray(data?.tables) ? data.tables : [];
            const writableTables = availableTables.filter((table) => table?.crud_allowed);
            const existingActiveTable = typeof current?.activeTable === 'string' ? current.activeTable : null;
            const activeTableExists = existingActiveTable
                ? availableTables.some((table) => table?.table_name === existingActiveTable)
                : false;

            await dispatch(setSupabase('schema', data));
            await dispatch(setSupabase('activeTable', activeTableExists ? existingActiveTable : (writableTables[0]?.table_name || availableTables[0]?.table_name || null)));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            await dispatch(setSupabase('schemaError', msg));
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        } finally {
            await dispatch(setSupabase('schemaLoading', false));
        }
    };