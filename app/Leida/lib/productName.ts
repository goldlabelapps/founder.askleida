import type { T_AWINProduct } from '../types.d';
import { asText } from './asText';

export function productName(product: T_AWINProduct | null | undefined): string {
  if (!product) {
    return 'Untitled product';
  }

  return asText(product.product_name)
    || asText(product.title)
    || asText(product.name)
    || 'Untitled product';
}
