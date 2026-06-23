import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setLeida } from '../../../actions/setLeida';

export const initDash = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const leida = getState()?.redux?.leida || {};
            if (!leida.dash) await dispatch(setLeida('dash', {
                title: 'NX° Admin',
            }));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };