import { isRecord } from './isRecord';

export function parseJsonObject(value: unknown): unknown {
  if (isRecord(value) || Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}
