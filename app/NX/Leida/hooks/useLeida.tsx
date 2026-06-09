"use client";
import { useSelector } from 'react-redux';

export function useLeida() {
    const slice = useSelector((state: any) => state.redux.leida || {});
    return {
        ...slice,
    };
}
