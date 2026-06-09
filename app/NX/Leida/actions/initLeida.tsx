import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../Uberedux';
import { setLeida } from '../../Leida';

export const initLeida = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            console.log('Initializing Leida...');
            const leida = getState()?.redux?.leida || {};
            if (!leida.initted) await dispatch(setLeida('initted', true));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };