import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setAwin } from './setAwin';

type T_FetchAwinParams = {
    page: number;
    limit: number;
    orderBy: string;
    orderDir: 'asc' | 'desc';
    q?: string;
};

type T_FetchAwinResult = {
    ok: true;
    route: string;
    rows: any[];
    count: number;
} | {
    ok: false;
    error: string;
};

export const fetchAwin =
    ({ page, limit, orderBy, orderDir, q }: T_FetchAwinParams): any =>
        async (dispatch: Dispatch): Promise<T_FetchAwinResult> => {
            try {
                const offset = Math.max(0, (page - 1) * limit);
                const params = new URLSearchParams({
                    limit: String(limit),
                    offset: String(offset),
                    orderBy,
                    orderDir,
                });

                const trimmedQuery = typeof q === 'string' ? q.trim() : '';
                if (trimmedQuery) {
                    params.set('q', trimmedQuery);
                }

                const route = `/api/awin?${params.toString()}`;
                const res = await fetch(route, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                });

                const json = await res.json().catch(() => null);

                if (!res.ok) {
                    const message = json?.message || `Failed to fetch AWIN results (${res.status})`;
                    throw new Error(message);
                }

                const data = json?.data || {};
                const nextRows = Array.isArray(data?.rows) ? data.rows : [];
                const count = typeof data?.count === 'number' ? data.count : nextRows.length;

                await dispatch(setAwin('rows', nextRows));
                await dispatch(setAwin('products', nextRows));
                await dispatch(setAwin('count', count));
                await dispatch(setAwin('scanned', nextRows.length));
                await dispatch(setAwin('sourceRoute', route));
                await dispatch(setAwin('query', {
                    page,
                    limit,
                    offset,
                    orderBy,
                    orderDir,
                    q: trimmedQuery,
                }));

                return {
                    ok: true,
                    route,
                    rows: nextRows,
                    count,
                };
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : String(e);
                dispatch(setUbereduxKey({ key: 'error', value: message }));
                return {
                    ok: false,
                    error: message || 'AWIN query failed',
                };
            }
        };