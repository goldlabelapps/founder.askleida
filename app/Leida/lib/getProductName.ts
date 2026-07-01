import type { T_Product } from '../types.d';
import { toTrimmedText } from './toTrimmedText';

export function getProductName(product: T_Product): string {
  const data = product?.data && typeof product.data === 'object' && !Array.isArray(product.data)
    ? product.data as Record<string, unknown>
    : null;

  return toTrimmedText(data?.title)
    || toTrimmedText(product?.title)
    || toTrimmedText(product?.name)
    || toTrimmedText(product?.product_name)
    || toTrimmedText(data?.name)
    || toTrimmedText(data?.product_name)
    || toTrimmedText(product?.slug)
    || toTrimmedText(data?.slug)
    || 'Untitled product';
}
