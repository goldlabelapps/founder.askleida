import type { T_AwinProduct } from '../types.d';

export function inferAwinPrice(product: T_AwinProduct): string {
  const raw = product.search_price;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw.toFixed(2);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return '';
}
