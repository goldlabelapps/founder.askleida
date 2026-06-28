import type { T_AwinProduct } from '../types.d';
import { asText } from './asText';

export function productName(product: T_AwinProduct | null | undefined): string {
  if (!product) {
    return 'Untitled product';
  }

  return asText(product.product_name)
    || asText(product.title)
    || asText(product.name)
    || 'Untitled product';
}
