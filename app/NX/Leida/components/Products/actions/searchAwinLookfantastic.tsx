import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';

type T_SearchArgs = {
  query: string;
  category?: string;
  brand?: string;
  limit?: number;
  offset?: number;
};

export const searchAwinLookfantastic = ({ query, category = '', brand = '', limit = 25, offset = 0 }: T_SearchArgs): any =>
  async (dispatch: Dispatch) => {
    try {
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.loading', value: true }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.error', value: null }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.query', value: query }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.category', value: category }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.brand', value: brand }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.limit', value: limit }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.offset', value: offset }));

      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (category.trim()) params.set('category', category.trim());
      if (brand.trim()) params.set('brand', brand.trim());
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const response = await fetch(`/api/awin/lookfantastic/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const detail =
          (typeof json?.message === 'string' && json.message)
          || `AWIN Lookfantastic search failed (${response.status})`;
        throw new Error(detail);
      }

      const payload = json?.data ?? {};
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.rows', value: Array.isArray(payload?.rows) ? payload.rows : [] }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.count', value: typeof payload?.count === 'number' ? payload.count : 0 }));

      return payload;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.error', value: msg }));
      dispatch(setUbereduxKey({ key: 'error', value: msg }));
      throw e;
    } finally {
      dispatch(setUbereduxKey({ key: 'leida.products.awinSearch.loading', value: false }));
    }
  };
