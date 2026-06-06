import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setNXAdmin } from '../../../../NXAdmin';
import { fetchProducts } from './fetchProducts';

export const initProducts = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const nxAdmin = getState()?.redux?.nxAdmin || {};
            if (!nxAdmin.products) await dispatch(setNXAdmin('products', {
                slice: 'products',
            }));

            await dispatch(fetchProducts());
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };