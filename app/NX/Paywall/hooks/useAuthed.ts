"use client";
import { useState } from "react";
import type { User } from '@supabase/supabase-js';
import { useSupabaseAuthListener } from './useSupabaseAuthListener';

/**
 * useAuthed - React hook to get Supabase auth state
 * Returns: User object if authenticated, null otherwise
 */
export function useAuthed(): User | null {
    const [user, setUser] = useState<User | null>(null);
    useSupabaseAuthListener((supabaseUser) => {
        setUser(supabaseUser ?? null);
    });
    return user;
}
