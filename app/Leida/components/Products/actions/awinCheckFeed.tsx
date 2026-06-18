import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';

export const awinCheckFeed = (): any =>
  async (dispatch: Dispatch) => {
    try {
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedCheck.loading', value: true }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedCheck.error', value: null }));

      const response = await fetch('/api/awin/lookfantastic/sync', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const detail =
          (typeof json?.message === 'string' && json.message)
          || (typeof json?.error?.message === 'string' && json.error.message)
          || `Awin feed check failed (${response.status})`;
        throw new Error(detail);
      }

      const payload = json?.data ?? null;
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedCheck.response', value: payload }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedCheck.lastCheckedAt', value: new Date().toISOString() }));
      dispatch(setUbereduxKey({ key: 'success', value: json?.message || 'Awin feed check completed' }));

      return payload;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedCheck.error', value: msg }));
      dispatch(setUbereduxKey({ key: 'error', value: msg }));
      throw e;
    } finally {
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedCheck.loading', value: false }));
    }
  };