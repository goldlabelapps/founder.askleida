export function toTrimmedText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
