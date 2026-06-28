export function orderByFromSortField(field: string): 'product_name' | 'search_price' | 'brand' {
  if (field === 'price') {
    return 'search_price';
  }

  if (field === 'brand') {
    return 'brand';
  }

  return 'product_name';
}
