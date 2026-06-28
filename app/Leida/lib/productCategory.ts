import type { T_AwinProduct } from '../types.d';
import { asText } from './asText';

export function productCategory(product: T_AwinProduct | null | undefined): string {
  if (!product) {
    return '';
  }

  return asText(product.category_name) || asText(product.category);
}
