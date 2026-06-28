import { toTrimmedText } from './toTrimmedText';

export function normalizeUrl(value: string): string {
  const raw = toTrimmedText(value);
  if (!raw) return '';

  if (raw.startsWith('//')) return `https:${raw}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  if (/^[^\s]+\.[^\s]+/.test(raw)) return `https://${raw}`;

  return raw;
}
