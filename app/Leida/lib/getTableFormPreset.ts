import type { T_TableFormPreset } from '../types.d';

export function getTableFormPreset(tableName: string | null, presets: Record<string, T_TableFormPreset>): T_TableFormPreset {
  if (!tableName) return {};
  return presets[tableName] || {};
}
