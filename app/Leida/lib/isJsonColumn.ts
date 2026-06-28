const JSON_TYPES = new Set(['json', 'jsonb']);

export function isJsonColumn(dataType?: string, udtName?: string): boolean {
  return JSON_TYPES.has(String(udtName || '').toLowerCase()) || JSON_TYPES.has(String(dataType || '').toLowerCase());
}
