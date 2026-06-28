import type { T_SupabaseColumn } from '../types.d';
import { isBooleanColumn } from './isBooleanColumn';
import { isJsonColumn } from './isJsonColumn';
import { stringifyJson } from './stringifyJson';

export function getSupabaseFieldValue(draftObject: Record<string, any>, column: T_SupabaseColumn, columnName: string): string {
  const current = draftObject[columnName];
  if (current === undefined || current === null) {
    return '';
  }

  if (isJsonColumn(column.data_type, column.udt_name)) {
    return stringifyJson(current);
  }

  if (isBooleanColumn(column.data_type, column.udt_name)) {
    if (current === true) return 'true';
    if (current === false) return 'false';
    return '';
  }

  return String(current);
}
