import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setLeida, fetchLeida } from '../../../../Leida';

const DEFAULT_CLAUDE_STATE = {
    initted: true,
    prompt: '',
    loading: false,
    error: null,
    response: '',
    model: null,
    lastPrompt: '',
};

export const initClaude = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const leida = getState()?.redux?.leida || {};
            const currentClaude = leida?.claude || {};

            await dispatch(setLeida('claude', {
                ...DEFAULT_CLAUDE_STATE,
                ...currentClaude,
                initted: true,
            }));

            if (!currentClaude?.initted) {
                await dispatch(fetchLeida('/api/claude'));
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };
