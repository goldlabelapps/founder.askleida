import type { T_Product } from '../types.d';

export function getProductPrice(product: T_Product): number | null {
  const value = product?.price ?? product?.search_price ?? product?.store_price;

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
