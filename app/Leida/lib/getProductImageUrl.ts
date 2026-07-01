import type { T_Product } from '../types.d';

export function getProductImageUrl(product: T_Product): string | null {
  const data = product?.data && typeof product.data === 'object' && !Array.isArray(product.data)
    ? (product.data as Record<string, unknown>)
    : null;

  const candidates = [
    product?.thumbnail,
    product?.image,
    product?.image_url,
    product?.merchant_image_url,
    product?.aw_image_url,
    product?.merchant_thumb_url,
    product?.large_image,
    data?.thumbnail,
    data?.image,
    data?.image_url,
    data?.merchant_image_url,
    data?.aw_image_url,
    data?.merchant_thumb_url,
    data?.large_image,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}
