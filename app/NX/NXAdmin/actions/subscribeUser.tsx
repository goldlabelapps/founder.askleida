import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../Uberedux';
import { setNXAdmin } from '../../NXAdmin';
import { supabase } from '../../lib/supabase';

const activeSubscriptions: Record<string, boolean> = {};

export const subscribeUser = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const { subscribedUser } = getState().redux.nxadmin || {};
            const { uid } = getState().redux.paywall || {};
            if (!uid) return;

            // Guard: only subscribe if not already subscribed to this uid
            if (!subscribedUser || subscribedUser.uid !== uid) {
                dispatch(setNXAdmin('subscribedUser', { uid }));
                if (!activeSubscriptions[uid]) {
                    activeSubscriptions[uid] = true;
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('uid', uid)
                        .limit(1);

                    if (error) throw error;
                    dispatch(setNXAdmin('subscribedUser', data?.[0] || null));
                }
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };