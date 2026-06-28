import { getPathValue } from './getPathValue';
import { toTrimmedText } from './toTrimmedText';

export function pickFirstText(source: unknown, paths: string[]): string {
  for (const path of paths) {
    const value = toTrimmedText(getPathValue(source, path));
    if (value) return value;
  }
  return '';
}
