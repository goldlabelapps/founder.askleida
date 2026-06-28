export function sortFieldFromQuery(orderBy: unknown): string {
  if (orderBy === 'search_price') {
    return 'price';
  }

  if (orderBy === 'brand') {
    return 'brand';
  }

  return 'product_name';
}
