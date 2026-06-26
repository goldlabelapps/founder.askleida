import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setLeida } from '../../../../Leida';
import { fetchQueue } from './fetchQueue';

export const initQueue = (): any =>
  async (dispatch: Dispatch, getState: () => any) => {
    try {
      const leida = getState()?.redux?.leida || {};
      if (!leida.queue) {
        await dispatch(setLeida('queue', {
          initted: true,
        }));
        await dispatch(fetchQueue());
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      dispatch(setUbereduxKey({ key: 'error', value: msg }));
    }
  };