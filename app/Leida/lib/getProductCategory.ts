import type { T_Product } from '../types.d';
import { toTrimmedText } from './toTrimmedText';

export function getProductCategory(product: T_Product): string {
  return toTrimmedText(product?.category)
    || toTrimmedText(product?.category_name)
    || toTrimmedText(product?.merchant_category);
}
