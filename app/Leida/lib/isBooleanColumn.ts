const BOOLEAN_TYPES = new Set(['bool', 'boolean']);

export function isBooleanColumn(dataType?: string, udtName?: string): boolean {
  return BOOLEAN_TYPES.has(String(udtName || '').toLowerCase()) || BOOLEAN_TYPES.has(String(dataType || '').toLowerCase());
}
