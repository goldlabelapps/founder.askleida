import type { T_Product } from '../types.d';
import { pickFirstText } from './pickFirstText';

export function getAffiliateCategory(product: T_Product | undefined): string {
  if (!product) return 'Uncategorized';
  return pickFirstText(product, [
    'category',
    'category_name',
    'merchant_category',
    'data.category',
    'data.category_name',
    'data.merchant_category',
    'data.awin.category_name',
    'data.awin.product_basic.category',
  ]) || 'Uncategorized';
}
