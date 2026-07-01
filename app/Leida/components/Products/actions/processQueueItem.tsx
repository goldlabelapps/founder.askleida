import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';

type T_ProcessQueueItemParams = {
  queueId: string;
  practitionerId: string;
  productDataDraft: Record<string, unknown>;
};

type T_ProcessQueueItemResult = {
  ok: true;
  productId?: string | null;
  slug?: string | null;
} | {
  ok: false;
  error: string;
};

function asText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

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
              data: {
                ...productDataDraft,
                status: 'draft',
              },
              updated: new Date().toISOString(),
            },
          }),
        });

        const saveJson = await saveRes.json().catch(() => null);

        if (!saveRes.ok) {
          const message = saveJson?.message || `Failed to create product from queue item (${saveRes.status})`;
          throw new Error(message);
        }

        const payload = saveJson?.data ?? saveJson;
        const createdRecord = (() => {
          if (Array.isArray(payload)) {
            return payload[0] || null;
          }

          if (!payload || typeof payload !== 'object') {
            return null;
          }

          const maybeRows = (payload as Record<string, unknown>).rows;
          if (Array.isArray(maybeRows)) {
            return maybeRows[0] || null;
          }

          const maybeRow = (payload as Record<string, unknown>).row;
          if (maybeRow && typeof maybeRow === 'object') {
            return maybeRow;
          }

          return payload;
        })() as Record<string, unknown> | null;
        const createdProductId = asText(createdRecord?.product_id) || asText(createdRecord?.id) || asText(createdRecord?.uuid);
        const createdSlug = asText(createdRecord?.slug) || slug;

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

        return {
          ok: true,
          productId: createdProductId,
          slug: createdSlug,
        };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        dispatch(setUbereduxKey({ key: 'error', value: message }));
        return {
          ok: false,
          error: message || 'Failed to process selected queue item.',
        };
      }
    };
