import { findNestedTextByKeys } from './findNestedTextByKeys';
import { normalizeUrl } from './normalizeUrl';
import { pickFirstText } from './pickFirstText';

export function getAffiliateImageUrl(product: unknown): string {
  if (!product) return 'https://via.placeholder.com/1200x630?text=No+Image';

  const image = pickFirstText(product, [
    'image',
    'image_url',
    'merchant_image_url',
    'aw_image_url',
    'merchant_thumb_url',
    'large_image',
    'data.image',
    'data.image_url',
    'data.images.0',
    'data.aw_image_url',
    'data.merchant_image_url',
    'data.awinProduct.data.merchant_image_url',
    'data.awinProduct.data.aw_image_url',
    'data.awinProduct.product_basic.merchant_image_url',
    'data.awinProduct.product_basic.aw_image_url',
    'data.awinRow.data.merchant_image_url',
    'data.awinRow.data.aw_image_url',
    'data.awin.data.merchant_image_url',
    'data.awin.data.aw_image_url',
    'data.awin.product_basic.merchant_image_url',
    'data.awin.product_basic.aw_image_url',
  ]);

  const deepImage = image || findNestedTextByKeys(product, [
    'merchant_image_url',
    'aw_image_url',
    'image_url',
    'image',
    'thumbnail',
    'thumb_url',
  ]);

  const normalizedImage = normalizeUrl(deepImage);
  if (normalizedImage) return normalizedImage;

  return 'https://via.placeholder.com/1200x630?text=No+Image';
}
