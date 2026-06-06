import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../Uberedux';
import { setPaywall } from '../../Paywall';
import { supabase } from '../../lib/supabase';


export const login =
    (
        email: string, 
        password: string
    ): any =>
        async (dispatch: Dispatch, getState: () => any) => {
            try {
                dispatch(setPaywall('loggingIn', true));

                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error || !data.user) {
                    throw error || new Error('Unable to sign in.');
                }
                
                const userData = {
                    uid: data.user.id,
                    email: data.user.email,
                    displayName: data.user.user_metadata?.display_name ?? null,
                };
                
                dispatch(setPaywall('user', userData));
                dispatch(setPaywall('loggingIn', false));

            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                dispatch(setUbereduxKey({ key: 'error', value: msg }));
                dispatch(setPaywall('loggingIn', false));
            }
        };
