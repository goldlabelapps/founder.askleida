import type { T_AwinProduct } from '../types.d';
import { asText } from './asText';

export function productDeepLink(product: T_AwinProduct | null | undefined): string {
  if (!product) {
    return '';
  }

  return asText(product.aw_deep_link) || asText(product.merchant_deep_link);
}
