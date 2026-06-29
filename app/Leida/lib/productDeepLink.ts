import type { T_AWINProduct } from '../types.d';
import { asText } from './asText';

export function productDeepLink(product: T_AWINProduct | null | undefined): string {
  if (!product) {
    return '';
  }

  return asText(product.aw_deep_link) || asText(product.merchant_deep_link);
}
