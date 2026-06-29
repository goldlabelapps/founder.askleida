import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';

type T_DeleteProductQueueRecordsResult = {
  ok: true;
  deletedRows: number;
} | {
  ok: false;
  error: string;
};

export const deleteProductQueueRecords = (): any =>
  async (dispatch: Dispatch): Promise<T_DeleteProductQueueRecordsResult> => {
    try {
      const res = await fetch('/api/products/queue', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ deleteAll: true }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const message = json?.message || `Failed to delete product queue records (${res.status})`;
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
        error: message || 'Failed to delete product queue records.',
      };
    }
  };