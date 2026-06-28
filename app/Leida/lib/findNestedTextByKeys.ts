import { isRecord } from './isRecord';
import { parseJsonObject } from './parseJsonObject';
import { toTrimmedText } from './toTrimmedText';

export function findNestedTextByKeys(source: unknown, keys: string[]): string {
  const queue: unknown[] = [parseJsonObject(source)];
  const targetKeys = new Set(keys.map((key) => key.toLowerCase()));
  const seen = new Set<unknown>();

  while (queue.length) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    const parsedCurrent = parseJsonObject(current);

    if (Array.isArray(parsedCurrent)) {
      for (const item of parsedCurrent) queue.push(item);
      continue;
    }

    if (!isRecord(parsedCurrent)) continue;

    for (const [key, value] of Object.entries(parsedCurrent)) {
      const keyLower = key.toLowerCase();
      const textValue = toTrimmedText(value);
      if (targetKeys.has(keyLower) && textValue) {
        return textValue;
      }

      if (isRecord(value) || Array.isArray(value) || typeof value === 'string') {
        queue.push(value);
      }
    }
  }

  return '';
}
