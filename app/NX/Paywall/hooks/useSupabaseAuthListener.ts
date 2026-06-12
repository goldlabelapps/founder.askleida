"use client";
import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useDispatch } from '../../Uberedux';
import { setPaywall } from '../../Paywall';

/**
 * useSupabaseAuthListener
 * Sets up a global Supabase auth state listener and dispatches to Uberedux
 *
 * @param onUserChange Optional callback for user state changes
 * @param onAuthChecked Optional callback when auth check completes
 */
export function useSupabaseAuthListener(
  onUserChange?: (user: User | null) => void,
  onAuthChecked?: () => void,
) {
  const dispatch = useDispatch();

  useEffect(() => {
    let disposed = false;

    const applyUserState = (user: User | null) => {
      if (disposed) return;

      const safeUser = user
        ? {
            uid: user.id,
            email: user.email,
            emailVerified: !!user.email_confirmed_at,
            isAnonymous: false,
            providerData: [],
            displayName: user.user_metadata?.display_name ?? null,
            photoURL: user.user_metadata?.avatar_url ?? user.user_metadata?.avatar ?? null,
          }
        : null;

      dispatch(setPaywall('user', safeUser));
      dispatch(setPaywall('authChecked', true));
      dispatch(setPaywall('uid', safeUser?.uid ?? null));
      if (onUserChange) onUserChange(user);
      if (onAuthChecked) onAuthChecked();
    };

    supabase.auth.getSession().then(({ data }) => {
      applyUserState(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUserState(session?.user ?? null);
    });

    return () => {
      disposed = true;
      listener.subscription.unsubscribe();
    };
  }, [dispatch, onUserChange, onAuthChecked]);
}
