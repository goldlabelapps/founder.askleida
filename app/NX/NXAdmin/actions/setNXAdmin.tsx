import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../Uberedux';

export const setLeidaAdmin =
    (key: string, value: any): any =>
        async (dispatch: Dispatch, getState: () => any) => {
            try {
                // Get current value from state
                const state = getState();
                const current = (state?.redux?.leida) || {};
                // Add/overwrite the incoming key-value pair
                const updated = { ...current, [key]: value };
                // Set the updated object in Uberedux
                dispatch(setUbereduxKey({ key: 'leida', value: updated }));
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                dispatch(setUbereduxKey({ key: 'error', value: msg }));
            }
        };

// Backward-compatible alias.
export const setNXAdmin = setLeidaAdmin;
