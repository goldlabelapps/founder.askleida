import type { T_Product } from '../types.d';
import { findNestedTextByKeys } from './findNestedTextByKeys';
import { normalizeUrl } from './normalizeUrl';
import { pickFirstText } from './pickFirstText';

export function getAffiliateMerchantLink(product: T_Product | undefined): string {
  if (!product) return '';

  const link = pickFirstText(product, [
    'aw_deep_link',
    'merchant_deep_link',
    'deeplink',
    'deep_link',
    'url',
    'product_url',
    'data.awinDeepLink',
    'data.merchant_deep_link',
    'data.aw_deep_link',
    'data.deeplink',
    'data.deep_link',
    'data.url',
    'data.product_url',
    'data.awinProduct.merchant_deep_link',
    'data.awinProduct.aw_deep_link',
    'data.awinProduct.data.merchant_deep_link',
    'data.awinProduct.data.aw_deep_link',
    'data.awinRow.data.merchant_deep_link',
    'data.awinRow.data.aw_deep_link',
    'data.awin.merchant_deep_link',
    'data.awin.aw_deep_link',
    'data.awin.product_basic.aw_deep_link',
  ]);

  const deepLink = link || findNestedTextByKeys(product, [
    'merchant_deep_link',
    'aw_deep_link',
    'deeplink',
    'deep_link',
    'product_url',
    'url',
  ]);

  return normalizeUrl(deepLink);
}
