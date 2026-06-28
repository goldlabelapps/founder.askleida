import type { T_AwinProduct } from '../types.d';
import { asId } from './asId';
import { asText } from './asText';

export function productIdentity(product: T_AwinProduct | null | undefined): string {
  if (!product) {
    return '';
  }

  return asText(product.id)
    || asId(product.id)
    || asText(product.unique_key)
    || asText(product.aw_product_id)
    || asText(product.merchant_product_id);
}
