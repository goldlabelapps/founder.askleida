import type { T_Product } from '../types.d';
import { toTrimmedText } from './toTrimmedText';

export function getProductUpdatedAt(product: T_Product): number {
  const raw = toTrimmedText(product?.updated) || toTrimmedText(product?.created);
  if (!raw) return 0;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}
