import type { T_Product } from '../types.d';
import { toTrimmedText } from './toTrimmedText';

export function getProductBrand(product: T_Product): string {
  return toTrimmedText(product?.brand)
    || toTrimmedText(product?.brand_name);
}
