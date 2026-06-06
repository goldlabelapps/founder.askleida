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
            const missingAccountsTable =
                error.code === 'PGRST205' ||
                error.message?.toLowerCase().includes('could not find the table') ||
                error.message?.toLowerCase().includes('relation "accounts" does not exist');

            const message = missingAccountsTable
                ? 'Supabase table `accounts` was not found. Create it or update Paywall to the correct table name.'
                : (error.message || 'Error loading account');

            dispatch(setPaywall('error', message));
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