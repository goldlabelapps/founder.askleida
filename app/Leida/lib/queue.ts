import type { T_QueueRow } from '../types.d';

const QUEUE_COUNT_REFRESH_EVENT = 'leida:queue-count-refresh';
const PRODUCTS_COUNT_REFRESH_EVENT = 'leida:products-count-refresh';

export function queueAsText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function queueAsObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function getQueueRowTitle(row: T_QueueRow): string {
  const data = queueAsObject(row?.data);
  const basic = queueAsObject(data.product_basic);

  const candidates: unknown[] = [
    data.product_name,
    basic.title,
    basic.name,
    data.title,
    data.name,
    row?.source_product_id,
    data.merchant_product_id,
    data.aw_product_id,
  ];

  for (const value of candidates) {
    const text = queueAsText(value);
    if (text) {
      return text;
    }
  }

  return 'Queue item';
}

export function notifyQueueCountRefresh() {
  window.dispatchEvent(new Event(QUEUE_COUNT_REFRESH_EVENT));
}

export function notifyProductsCountRefresh() {
  window.dispatchEvent(new Event(PRODUCTS_COUNT_REFRESH_EVENT));
}