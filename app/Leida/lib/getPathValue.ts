import { isRecord } from './isRecord';
import { parseJsonObject } from './parseJsonObject';

export function getPathValue(source: unknown, path: string): unknown {
  const parts = path.split('.');
  let cursor: unknown = parseJsonObject(source);

  for (const part of parts) {
    cursor = parseJsonObject(cursor);

    if (Array.isArray(cursor)) {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 0 || index >= cursor.length) return undefined;
      cursor = cursor[index];
      continue;
    }

    if (!isRecord(cursor)) return undefined;
    cursor = cursor[part];
  }

  return cursor;
}
