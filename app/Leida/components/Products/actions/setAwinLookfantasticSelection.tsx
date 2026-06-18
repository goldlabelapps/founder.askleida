import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';

export const setAwinLookfantasticSelection = (row: Record<string, any> | null): any =>
  async (dispatch: Dispatch) => {
    dispatch(setUbereduxKey({
      key: 'leida.products.awinSearch.selectedKey',
      value: row?.unique_key ? String(row.unique_key) : null,
    }));
  };
