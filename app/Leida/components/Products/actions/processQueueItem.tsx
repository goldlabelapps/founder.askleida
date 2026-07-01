import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';

type T_ProcessQueueItemParams = {
  queueId: string;
  practitionerId: string;
  productDataDraft: Record<string, unknown>;
};

type T_ProcessQueueItemResult = {
  ok: true;
} | {
  ok: false;
  error: string;
};

export const processQueueItem =
  ({ queueId, practitionerId, productDataDraft }: T_ProcessQueueItemParams): any =>
    async (dispatch: Dispatch): Promise<T_ProcessQueueItemResult> => {
      try {
        const slug = typeof productDataDraft.slug === 'string' ? productDataDraft.slug : null;

        const saveRes = await fetch('/api/supabase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            resource: 'table-row',
            table: 'products',
            values: {
              practitioner_id: practitionerId,
              ...(slug ? { slug } : {}),
              data: productDataDraft,
              updated: new Date().toISOString(),
            },
          }),
        });

        const saveJson = await saveRes.json().catch(() => null);

        if (!saveRes.ok) {
          const message = saveJson?.message || `Failed to create product from queue item (${saveRes.status})`;
          throw new Error(message);
        }

        const removeRes = await fetch('/api/products/queue', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            selection: {
              type: 'include',
              ids: [queueId],
            },
          }),
        });

        const removeJson = await removeRes.json().catch(() => null);

        if (!removeRes.ok) {
          const message = removeJson?.message || `Failed to remove processed queue item (${removeRes.status})`;
          throw new Error(message);
        }

        return { ok: true };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        dispatch(setUbereduxKey({ key: 'error', value: message }));
        return {
          ok: false,
          error: message || 'Failed to process selected queue item.',
        };
      }
    };
