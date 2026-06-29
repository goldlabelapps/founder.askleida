import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../../NX/Uberedux';
import { setAWIN } from './setAWIN';

type T_FetchAWINParams = {
    page: number;
    limit: number;
    orderBy: string;
    orderDir: 'asc' | 'desc';
    q?: string;
    includeQueued?: boolean;
};

type T_FetchAWINResult = {
    ok: true;
    route: string;
    rows: any[];
    count: number;
} | {
    ok: false;
    error: string;
};

export const fetchAWIN =
    ({ page, limit, orderBy, orderDir, q, includeQueued = false }: T_FetchAWINParams): any =>
        async (dispatch: Dispatch): Promise<T_FetchAWINResult> => {
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
                params.set('includeQueued', includeQueued ? '1' : '0');

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

                await dispatch(setAWIN('rows', nextRows));
                await dispatch(setAWIN('products', nextRows));
                await dispatch(setAWIN('count', count));
                await dispatch(setAWIN('scanned', nextRows.length));
                await dispatch(setAWIN('sourceRoute', route));
                await dispatch(setAWIN('query', {
                    page,
                    limit,
                    offset,
                    orderBy,
                    orderDir,
                    q: trimmedQuery,
                    includeQueued,
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