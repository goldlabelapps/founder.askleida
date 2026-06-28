export function toDate(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '—';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
}
