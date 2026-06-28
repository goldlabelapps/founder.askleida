import type { T_Product } from '../types.d';
import { getProductBrand } from './getProductBrand';
import { getProductCategory } from './getProductCategory';
import { getProductName } from './getProductName';
import { toTrimmedText } from './toTrimmedText';

export function includesProductQuery(product: T_Product, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;

  const haystack = [
    getProductName(product),
    toTrimmedText(product?.description),
    getProductBrand(product),
    getProductCategory(product),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}
