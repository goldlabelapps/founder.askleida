import type { T_SupabaseColumn } from '../types.d';
import { isBooleanColumn } from './isBooleanColumn';
import { isJsonColumn } from './isJsonColumn';
import { isNumericColumn } from './isNumericColumn';

export function parseSupabaseFieldValue(rawValue: string, column: T_SupabaseColumn): unknown {
  if (rawValue === '') {
    return column.nullable ? null : '';
  }

  if (isJsonColumn(column.data_type, column.udt_name)) {
    return JSON.parse(rawValue);
  }

  if (isBooleanColumn(column.data_type, column.udt_name)) {
    if (rawValue === 'true') return true;
    if (rawValue === 'false') return false;
    return column.nullable ? null : false;
  }

  if (isNumericColumn(column.data_type, column.udt_name)) {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid number for ${column.udt_name || column.data_type || 'numeric field'}`);
    }
    return parsed;
  }

  return rawValue;
}
