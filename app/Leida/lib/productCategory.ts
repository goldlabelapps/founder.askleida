import type { T_AWINProduct } from '../types.d';
import { asText } from './asText';

export function productCategory(product: T_AWINProduct | null | undefined): string {
  if (!product) {
    return '';
  }

  return asText(product.category_name) || asText(product.category);
}
