import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setNXAdmin } from '../../../../NXAdmin';
import { setProducts } from './setProducts';

export const fetchProducts = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const nxAdmin = getState()?.redux?.nxAdmin || {};
            if (!nxAdmin.products) {
                await dispatch(setNXAdmin('products', {
                    slice: 'products',
                }));
            }

            await dispatch(setProducts('loading', true));

            const res = await fetch('/api/products', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            let json: any = null;
            try {
                json = await res.json();
            } catch {
                json = null;
            }

            if (!res.ok) {
                const message = json?.message || `Failed to fetch products (${res.status})`;
                throw new Error(message);
            }

            const list = Array.isArray(json?.data) ? json.data : [];
            await dispatch(setProducts('list', list));
            await dispatch(setProducts('loading', false));

        } catch (e: unknown) {
            dispatch(setProducts('loading', false));
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };