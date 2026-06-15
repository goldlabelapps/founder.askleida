import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';

export const fetchAwinLookfantasticCategories = (): any =>
  async (dispatch: Dispatch) => {
    try {
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.categoriesLoading', value: true }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.categoriesError', value: null }));

      const response = await fetch('/api/awin/lookfantastic/categories', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = typeof json?.message === 'string'
          ? json.message
          : `AWIN Lookfantastic categories failed (${response.status})`;
        throw new Error(detail);
      }

      const payload = json?.data ?? {};
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.categories', value: Array.isArray(payload?.categories) ? payload.categories : [] }));
      return payload;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.categoriesError', value: msg }));
      return null;
    } finally {
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.categoriesLoading', value: false }));
    }
  };
