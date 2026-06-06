import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../Uberedux';
import { setPaywall } from '../../Paywall';
import { setFeedback } from '../../DesignSystem';
import { supabase } from '../../lib/supabase';

export const updateAccount = (
    key: string, 
    value: any,
    successMsg?: string
): any =>
async (dispatch: Dispatch, getState: () => any) => {
    try {
        const uid = getState()?.redux?.paywall?.uid ?? null;
        if (!uid) {
            dispatch(setPaywall('error', 'No UID found'));
            return;
        }
        const updateObj: Record<string, any> = {};
        updateObj[key] = value;
        updateObj['updated'] = Date.now();

        const { data, error } = await supabase
            .from('accounts')
            .update(updateObj)
            .eq('uid', uid)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            dispatch(setPaywall('error', 'Account not found'));
            dispatch(setFeedback({ 
                severity: 'warning', 
                title: 'Account not found', 
                description: uid,
            }));     
            return;
        }

        dispatch(setFeedback({
            severity: 'info',
            title: successMsg || 'Account updated',
        }));
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        dispatch(setUbereduxKey({ key: 'error', value: msg }));
    }
};