export function formatNumber(value?: number): string {
  return typeof value === 'number' ? value.toLocaleString() : '0';
}
