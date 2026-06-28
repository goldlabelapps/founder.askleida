import type { T_Record } from '../types.d';

export function isRecord(value: unknown): value is T_Record {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
