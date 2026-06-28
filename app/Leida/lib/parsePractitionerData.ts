import type { T_PractitionerData } from '../types.d';

export function parsePractitionerData(value: unknown): T_PractitionerData {
  if (!value) return {};
  if (typeof value === 'object') {
    return value as T_PractitionerData;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return parsed as T_PractitionerData;
      }
    } catch {
      return {};
    }
  }
  return {};
}
