import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setLeida, fetchLeida } from '../../../../Leida';

export const initPractitioners = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const leida = getState()?.redux?.leida || {};
            if (!leida.practitioners) {
                await dispatch(setLeida('practitioners', {
                    initted: true,
                }));
                await dispatch(fetchLeida('/api/practitioners'));
            }

        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };