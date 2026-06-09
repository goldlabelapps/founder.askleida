"use client";
import { useSelector } from 'react-redux';
import { normalizeLeidaRouteKey } from '../lib/normalizeLeidaRouteKey';

const EMPTY_LEIDA = {};
const EMPTY_BUS_ENTRY = { loading: false, error: null, data: [] };

export function useLeida() {
    const slice = useSelector((state: any) => state.redux.leida ?? EMPTY_LEIDA);
    return slice;
}

export function useLeidaBus(route: string) {
    const normalizedRoute = normalizeLeidaRouteKey(route);
    const entry = useSelector((state: any) => {
        const bus = state?.redux?.leida?.bus || {};
        if (!normalizedRoute) return EMPTY_BUS_ENTRY;
        return bus[normalizedRoute] || EMPTY_BUS_ENTRY;
    });
    return entry;
}
