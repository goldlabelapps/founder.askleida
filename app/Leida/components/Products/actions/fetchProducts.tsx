import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setProducts } from './setProducts';

type T_FetchProductsParams = {
	page: number;
	pageSize: number;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
	q?: string;
};

type T_FetchProductsResult = {
	ok: true;
	route: string;
	rows: any[];
	total: number;
} | {
	ok: false;
	error: string;
};

export const fetchProducts =
	({ page, pageSize, sortBy, sortOrder, q }: T_FetchProductsParams): any =>
		async (dispatch: Dispatch): Promise<T_FetchProductsResult> => {
			try {
				const normalizedSortBy = sortBy === 'title' ? 'slug' : sortBy;
				const params = new URLSearchParams({
					page: String(page),
					pageSize: String(pageSize),
					sortBy: normalizedSortBy,
					sortOrder,
				});

				const trimmedQuery = typeof q === 'string' ? q.trim() : '';
				if (trimmedQuery) {
					params.set('q', trimmedQuery);
				}

				const route = `/api/products?${params.toString()}`;
				const res = await fetch(route, {
					method: 'GET',
					headers: {
						Accept: 'application/json',
					},
				});

				const json = await res.json().catch(() => null);

				if (!res.ok) {
					const message = json?.message || `Failed to fetch products (${res.status})`;
					throw new Error(message);
				}

				const data = json?.data || {};
				const nextRows = Array.isArray(data?.rows) ? data.rows : [];
				const total = typeof data?.total === 'number' ? data.total : nextRows.length;

				await dispatch(setProducts('rows', nextRows));
				await dispatch(setProducts('count', total));
				await dispatch(setProducts('query', {
					page,
					pageSize,
					sortBy: normalizedSortBy,
					sortOrder,
					q: trimmedQuery,
				}));
				await dispatch(setProducts('sourceRoute', route));

				return {
					ok: true,
					route,
					rows: nextRows,
					total,
				};
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : String(e);
				dispatch(setUbereduxKey({ key: 'error', value: message }));
				return {
					ok: false,
					error: message || 'Products query failed',
				};
			}
		};
