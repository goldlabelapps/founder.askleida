import type { Dispatch } from 'redux';
import { supabase } from '../../lib/supabase';
import { setFeedback } from '../../DesignSystem';

export const supabaseLogin = async (email: string, password: string, dispatch: Dispatch) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        dispatch(setFeedback({ severity: 'error', title: 'Login failed', description: error.message }));
        throw error;
    }

    dispatch(setFeedback({
        severity: 'success',
        title: `Hello ${email}`,
    }));

    return data.user;
};

export const supabaseLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};
