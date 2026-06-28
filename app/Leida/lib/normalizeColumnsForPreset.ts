import type { T_SupabaseColumn, T_TableFormPreset } from '../types.d';

export function normalizeColumnsForPreset(columns: T_SupabaseColumn[], preset: T_TableFormPreset): T_SupabaseColumn[] {
  const hidden = new Set(preset.hiddenFields || []);
  const visibleColumns = columns.filter((column) => {
    const name = column?.name || '';
    return !hidden.has(name);
  });

  const order = preset.fieldOrder || [];
  const rank = new Map<string, number>();
  order.forEach((name, index) => rank.set(name, index));

  return [...visibleColumns].sort((a, b) => {
    const aName = a.name || '';
    const bName = b.name || '';
    const aRank = rank.has(aName) ? (rank.get(aName) as number) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(bName) ? (rank.get(bName) as number) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return aName.localeCompare(bName);
  });
}
