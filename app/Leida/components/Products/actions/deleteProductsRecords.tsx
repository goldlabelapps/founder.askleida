import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';

type T_DeleteProductsRecordsParams = {
  q?: string;
  selection?: {
    type: 'include' | 'exclude';
    ids: string[];
  };
};

type T_DeleteProductsRecordsResult = {
  ok: true;
  deletedRows: number;
} | {
  ok: false;
  error: string;
};

export const deleteProductsRecords =
  ({ q, selection }: T_DeleteProductsRecordsParams = {}): any =>
  async (dispatch: Dispatch): Promise<T_DeleteProductsRecordsResult> => {
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          q: typeof q === 'string' ? q.trim() : '',
          selection: selection || {
            type: 'exclude',
            ids: [],
          },
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const message = json?.message || `Failed to delete product records (${res.status})`;
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
        error: message || 'Failed to delete product records.',
      };
    }
  };
