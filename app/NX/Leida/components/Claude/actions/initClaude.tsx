import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setLeida, fetchLeida } from '../../../../Leida';

export const initClaude = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const leida = getState()?.redux?.leida || {};
            if (!leida.claude) {
                await dispatch(setLeida('claude', {
                    initted: true,
                }));
                await dispatch(fetchLeida('/api/claude'));
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };
