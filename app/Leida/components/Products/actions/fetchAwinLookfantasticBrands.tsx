import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';

type T_FetchBrandsArgs = {
  category?: string;
  limit?: number;
};

export const fetchAwinLookfantasticBrands = ({ category = '', limit = 100 }: T_FetchBrandsArgs = {}): any =>
  async (dispatch: Dispatch) => {
    try {
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.brandsLoading', value: true }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.brandsError', value: null }));

      const params = new URLSearchParams();
      if (category.trim()) params.set('category', category.trim());
      params.set('limit', String(limit));

      const response = await fetch(`/api/awin/lookfantastic/brands?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = typeof json?.message === 'string'
          ? json.message
          : `AWIN Lookfantastic brands failed (${response.status})`;
        throw new Error(detail);
      }

      const payload = json?.data ?? {};
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.brands', value: Array.isArray(payload?.brands) ? payload.brands : [] }));
      return payload;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.brandsError', value: msg }));
      return null;
    } finally {
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.brandsLoading', value: false }));
    }
  };
