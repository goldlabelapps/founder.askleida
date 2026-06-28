import type { T_Product } from '../types.d';

export function getProductImageUrl(product: T_Product): string | null {
  const candidates = [
    product?.image,
    product?.image_url,
    product?.merchant_image_url,
    product?.aw_image_url,
    product?.merchant_thumb_url,
    product?.large_image,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}
