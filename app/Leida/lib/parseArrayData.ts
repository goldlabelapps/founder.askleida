export function parseArrayData(payload: any): any[] {
  if (Array.isArray(payload?.data?.tables)) return payload.data.tables;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.tables)) return payload.tables;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  if (payload?.data && typeof payload.data === 'object') return [payload.data];
  return [];
}
