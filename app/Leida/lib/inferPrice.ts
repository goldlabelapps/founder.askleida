import type { T_AWINProduct } from '../types.d';

export function inferPrice(product: T_AWINProduct): string {
  const raw = product.search_price;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw.toFixed(2);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return '';
}
