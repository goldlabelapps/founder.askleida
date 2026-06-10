"use client";
import { useSelector } from 'react-redux';

export function useClaude() {
    const slice = useSelector((state: any) => state.redux.leida?.claude);
    return slice;
}
