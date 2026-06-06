import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../Uberedux';
import { setPaywall } from '../../Paywall';
import { supabase } from '../../lib/supabase';

export const subscribeAccount = (): any =>
async (dispatch: Dispatch, getState: () => any) => {
    try {

        const uid = getState()?.redux?.paywall?.uid ?? null;

        if (!uid) {
            dispatch(setPaywall('error', 'No UID found'));
            return;
        }

        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('uid', uid)
            .limit(1);

        if (error) {
            dispatch(setPaywall('error', error.message || 'Error loading account'));
            dispatch(setPaywall('accountSubscribing', false));
            return;
        }

        if (!data || data.length === 0) {
            dispatch(setPaywall('error', 'No account found for this uid'));
            dispatch(setPaywall('account', null));
        } else {
            dispatch(setPaywall('account', data[0]));
            dispatch(setPaywall('error', null));
        }

        dispatch(setPaywall('accountSubscribing', false));
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        dispatch(setUbereduxKey({ key: 'error', value: msg }));
    }
};