import type { T_Product } from '../types.d';
import { pickFirstText } from './pickFirstText';

export function getAffiliateDescription(product: T_Product | undefined): string {
  if (!product) return '';
  return pickFirstText(product, [
    'description',
    'data.description',
    'data.awin.description',
    'data.awin.product_basic.description',
  ]);
}
