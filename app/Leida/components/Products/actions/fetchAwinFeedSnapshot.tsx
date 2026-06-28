import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';

type T_AwinFeedSnapshotLatest = {
  id?: number | string | null;
  snapshot_id?: number | string | null;
  created_at?: string | null;
  storage_path?: string | null;
} | null;

type T_FetchAwinFeedSnapshotResult = {
  ok: true;
  message: string;
  changed: boolean | null;
  reason: string | null;
  latest: T_AwinFeedSnapshotLatest;
} | {
  ok: false;
  error: string;
};

export const fetchAwinFeedSnapshot = (): any =>
  async (dispatch: Dispatch): Promise<T_FetchAwinFeedSnapshotResult> => {
    try {
      const res = await fetch('/api/awin/lookfantastic/feed?source=feed', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const message = json?.message || `Failed to check Awin feed snapshot (${res.status})`;
        throw new Error(message);
      }

      return {
        ok: true,
        message: typeof json?.message === 'string'
          ? json.message
          : 'Awin feed snapshot checked.',
        changed: typeof json?.data?.changed === 'boolean' ? json.data.changed : null,
        reason: typeof json?.data?.reason === 'string' ? json.data.reason : null,
        latest: json?.data?.latest ?? null,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      dispatch(setUbereduxKey({ key: 'error', value: message }));
      return {
        ok: false,
        error: message || 'Failed to check Awin feed snapshot.',
      };
    }
  };