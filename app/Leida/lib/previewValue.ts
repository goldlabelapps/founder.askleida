import { stringifyJson } from './stringifyJson';

export function previewValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') {
    const stringified = stringifyJson(value);
    return stringified.length > 60 ? `${stringified.slice(0, 57)}...` : stringified;
  }
  return String(value);
}
