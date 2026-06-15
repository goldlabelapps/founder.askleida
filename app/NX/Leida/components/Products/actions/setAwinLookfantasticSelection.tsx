import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';

export const setAwinLookfantasticSelection = (row: Record<string, any> | null): any =>
  async (dispatch: Dispatch) => {
    dispatch(setUbereduxKey({ key: 'leida.products.pendingAwinProduct', value: row }));
  };
