import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../NX/Uberedux';

export const setLeida =
    (key: string, value: any): any =>
        async (dispatch: Dispatch, getState: () => any) => {
            try {
                const state = getState();
                const current = (state?.redux?.leida) || {};
                const updated = { ...current, [key]: value };
                dispatch(setUbereduxKey({ key: 'leida', value: updated }));
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                dispatch(setUbereduxKey({ key: 'error', value: msg }));
            }
        };
