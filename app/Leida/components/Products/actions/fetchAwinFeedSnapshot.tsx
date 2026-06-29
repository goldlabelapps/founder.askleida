import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';

type T_AWINFeedSnapshotLatest = {
  id?: number | string | null;
  snapshot_id?: number | string | null;
  created_at?: string | null;
  storage_path?: string | null;
} | null;

type T_FetchAWINFeedSnapshotResult = {
  ok: true;
  message: string;
  changed: boolean | null;
  reason: string | null;
  latest: T_AWINFeedSnapshotLatest;
} | {
  ok: false;
  error: string;
};

export const fetchAWINFeedSnapshot = (): any =>
  async (dispatch: Dispatch): Promise<T_FetchAWINFeedSnapshotResult> => {
    try {
      const res = await fetch('/api/awin/lookfantastic/sync', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const message = json?.message || `Failed to check AWIN feed snapshot (${res.status})`;
        throw new Error(message);
      }

      return {
        ok: true,
        message: typeof json?.message === 'string'
          ? json.message
          : 'AWIN feed sync checked.',
        changed: typeof json?.data?.changed === 'boolean' ? json.data.changed : null,
        reason: typeof json?.data?.reason === 'string' ? json.data.reason : null,
        latest: (json?.data?.latest ?? json?.data?.saved ?? null) as T_AWINFeedSnapshotLatest,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      dispatch(setUbereduxKey({ key: 'error', value: message }));
      return {
        ok: false,
        error: message || 'Failed to check AWIN feed snapshot.',
      };
    }
  };