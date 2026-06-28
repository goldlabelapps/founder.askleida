import type { T_AwinProduct } from '../types.d';

export function productPriceValue(product: T_AwinProduct | null | undefined): number | null {
  if (!product) {
    return null;
  }

  const raw = product.search_price ?? product.price;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string') {
    const normalized = raw.replace(/[^0-9.-]/g, '').trim();
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
