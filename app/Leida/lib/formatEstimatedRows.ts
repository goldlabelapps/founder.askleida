export function formatEstimatedRows(value?: number): string {
  if (typeof value !== 'number') return 'N/A';
  if (value < 0) return 'Unknown';
  return value.toLocaleString();
}
