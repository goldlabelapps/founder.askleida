import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../Uberedux';
import { setPaywall } from '../../Paywall';
import { supabase } from '../../lib/supabase';

export const avatarsByUID = () =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            // console.log("avatarCRUD", action);
            const uid = getState()?.redux?.paywall?.uid ?? null;
            if (!uid) return;

            const { data, error } = await supabase
                .from('avatars')
                .select('*')
                .eq('uid', uid);

            if (error) {
                dispatch(setPaywall('error', error.message || 'Error loading avatars'));
                return;
            }

            const avatars: Record<string, any> = {};
            (data || []).forEach((avatar: any, index: number) => {
                const key = avatar.id ?? String(index);
                avatars[key] = avatar;
            });

            dispatch(setPaywall('avatarsByUID', avatars));

        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };
