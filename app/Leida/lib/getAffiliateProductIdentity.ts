import type { T_Product } from '../types.d';
import { pickFirstText } from './pickFirstText';

export function getAffiliateProductIdentity(product: T_Product | undefined): string {
  if (!product) return '';

  return pickFirstText(product, [
    'id',
    'unique_key',
    'aw_product_id',
    'merchant_product_id',
    'ean',
    'name',
    'title',
    'product_name',
    'data.id',
    'data.unique_key',
    'data.aw_product_id',
    'data.merchant_product_id',
  ]);
}
