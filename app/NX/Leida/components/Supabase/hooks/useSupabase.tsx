"use client";
import { useSelector } from 'react-redux';
import { EMPTY_SUPABASE_STATE } from '../types';

export function useSupabase() {
    const slice = useSelector((state: any) => state.redux.leida?.supabase ?? EMPTY_SUPABASE_STATE);
    return slice;
}