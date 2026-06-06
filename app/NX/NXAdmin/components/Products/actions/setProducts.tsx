import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';

export const setProducts =
    (key: string, value: any): any =>
        async (dispatch: Dispatch, getState: () => any) => {
            try {
                const state = getState();
                const current = (state?.redux?.nxAdmin?.products) || {};
                const updated = { ...current, [key]: value };
                dispatch(setUbereduxKey({ key: 'nxAdmin.products', value: updated }));
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                dispatch(setUbereduxKey({ key: 'error', value: msg }));
            }
        };