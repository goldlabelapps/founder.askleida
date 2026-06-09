"use client";
import { useSelector } from 'react-redux';

const EMPTY_LEIDA = {};

export function useLeida() {
    const slice = useSelector((state: any) => state.redux.leida ?? EMPTY_LEIDA);
    return slice;
}
