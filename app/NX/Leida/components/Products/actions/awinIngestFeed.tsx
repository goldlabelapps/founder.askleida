import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';

export const awinIngestFeed = (): any =>
  async (dispatch: Dispatch) => {
    try {
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedIngest.loading', value: true }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedIngest.error', value: null }));

      const response = await fetch('/api/awin/lookfantastic/ingest', {
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
          || `Awin feed ingest failed (${response.status})`;
        throw new Error(detail);
      }

      const payload = json?.data ?? null;
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedIngest.response', value: payload }));
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedIngest.lastRunAt', value: new Date().toISOString() }));
      dispatch(setUbereduxKey({ key: 'success', value: json?.message || 'Awin feed ingest completed' }));

      return payload;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedIngest.error', value: msg }));
      dispatch(setUbereduxKey({ key: 'error', value: msg }));
      throw e;
    } finally {
      dispatch(setUbereduxKey({ key: 'leida.products.awinFeedIngest.loading', value: false }));
    }
  };