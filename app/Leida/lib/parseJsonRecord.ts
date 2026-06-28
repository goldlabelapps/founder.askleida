export function parseJsonRecord(text: string, label?: string): Record<string, any> {
  const parsed = JSON.parse(text || '{}');
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(label ? `${label} must be a JSON object` : 'Row payload must be a JSON object');
  }
  return parsed;
}
