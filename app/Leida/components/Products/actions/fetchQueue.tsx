import type { Dispatch } from 'redux';
import { fetchLeida } from '../../../../Leida';

export const fetchQueue = (): any =>
  async (dispatch: Dispatch) => dispatch(fetchLeida('/api/products/queue'));