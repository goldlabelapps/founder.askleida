import type { T_Product } from '../types.d';

export function getProductPriceLabel(product: T_Product): string | null {
  const raw = product?.price ?? product?.search_price ?? product?.store_price;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return `GBP ${raw.toFixed(2)}`;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const normalized = raw.trim();
    if (/^\d+(\.\d+)?$/.test(normalized)) {
      return `GBP ${normalized}`;
    }
    return normalized;
  }
  return null;
}
