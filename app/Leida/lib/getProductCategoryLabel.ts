import type { T_Product } from '../types.d';

export function getProductCategoryLabel(product: T_Product): string | null {
  const value = product?.category ?? product?.category_name ?? product?.merchant_category;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
