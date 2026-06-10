import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setLeida } from '../../../actions/setLeida';

export const initAwin = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const leida = getState()?.redux?.leida || {};
            if (!leida.awin) await dispatch(setLeida('awin', {
                initted: true,
            }));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };