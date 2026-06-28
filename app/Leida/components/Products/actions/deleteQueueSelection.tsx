import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';

type T_DeleteQueueSelectionParams = {
  q?: string;
  status?: string;
  selection: {
    type: 'include' | 'exclude';
    ids: string[];
  };
};

type T_DeleteQueueSelectionResult = {
  ok: true;
  deletedRows: number;
} | {
  ok: false;
  error: string;
};

export const deleteQueueSelection =
  ({ q, status, selection }: T_DeleteQueueSelectionParams): any =>
    async (dispatch: Dispatch): Promise<T_DeleteQueueSelectionResult> => {
      try {
        const res = await fetch('/api/products/queue', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            q: typeof q === 'string' ? q.trim() : '',
            status: status || undefined,
            selection,
          }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const message = json?.message || `Failed to delete queue items (${res.status})`;
          throw new Error(message);
        }

        const deletedRows = typeof json?.data?.deletedRows === 'number'
          ? json.data.deletedRows
          : 0;

        return {
          ok: true,
          deletedRows,
        };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        dispatch(setUbereduxKey({ key: 'error', value: message }));
        return {
          ok: false,
          error: message || 'Failed to delete queue items.',
        };
      }
    };
