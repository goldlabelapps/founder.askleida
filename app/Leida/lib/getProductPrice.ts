import type { T_Product } from '../types.d';

export function getProductPrice(product: T_Product): number | null {
  const data = product?.data && typeof product.data === 'object' && !Array.isArray(product.data)
    ? (product.data as Record<string, unknown>)
    : null;

  const value = product?.price
    ?? product?.search_price
    ?? product?.store_price
    ?? data?.price
    ?? data?.search_price
    ?? data?.store_price;

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
