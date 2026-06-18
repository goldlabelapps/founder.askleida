import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../NX/Uberedux';
import { setLeida } from '../../Leida';
import { initSupabase } from '../components/Supabase/actions/initSupabase';

export const initLeida = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            console.log('Initializing Leida...');
            const leida = getState()?.redux?.leida || {};
            if (typeof leida?.claudePopupOpen !== 'boolean') {
                await dispatch(setLeida('claudePopupOpen', false));
            }
            if (!leida.initted) {
                await dispatch(setLeida('initted', true));
                await dispatch(initSupabase());
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };