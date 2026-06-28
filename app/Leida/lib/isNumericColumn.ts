const NUMERIC_TYPES = new Set(['int2', 'int4', 'int8', 'float4', 'float8', 'numeric', 'integer', 'bigint', 'smallint', 'real', 'double precision']);

export function isNumericColumn(dataType?: string, udtName?: string): boolean {
  return NUMERIC_TYPES.has(String(udtName || '').toLowerCase()) || NUMERIC_TYPES.has(String(dataType || '').toLowerCase());
}
