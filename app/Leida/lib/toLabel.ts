export function toLabel(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return 'Unknown';
  return value.replace(/_/g, ' ');
}
