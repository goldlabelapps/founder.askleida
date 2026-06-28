export function formatUkPrice(value: number | null): string {
  if (value === null) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value);
}
