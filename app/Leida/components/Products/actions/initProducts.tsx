import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setLeida, fetchLeida } from '../../../../Leida';

export const initProducts = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const leida = getState()?.redux?.leida || {};
            if (!leida.products) {
                await dispatch(setLeida('products', {
                    initted: true,
                }));
                await dispatch(fetchLeida('/api/products'));
            }

        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };