import type { T_Product } from '../types.d';
import { pickFirstText } from './pickFirstText';

export function getAffiliateTitle(product: T_Product | undefined): string {
  if (!product) return 'Untitled product';
  return pickFirstText(product, [
    'name',
    'title',
    'product_name',
    'data.name',
    'data.title',
    'data.product_name',
    'data.awin.product_name',
    'data.awin.product_basic.title',
    'data.awin.product_basic.name',
  ]) || 'Untitled product';
}
