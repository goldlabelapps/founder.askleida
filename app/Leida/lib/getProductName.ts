import type { T_Product } from '../types.d';
import { toTrimmedText } from './toTrimmedText';

export function getProductName(product: T_Product): string {
  return toTrimmedText(product?.name)
    || toTrimmedText(product?.title)
    || toTrimmedText(product?.product_name)
    || 'Untitled product';
}
