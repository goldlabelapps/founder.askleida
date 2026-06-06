import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../Uberedux';
import { setPaywall } from '../../Paywall';
import { supabase } from '../../lib/supabase';


export const logout =
    (): any =>
        async (dispatch: Dispatch, getState: () => any) => {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                
                dispatch(setPaywall('user', null));

            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                dispatch(setUbereduxKey({ key: 'error', value: msg }));
            }
        };
