export function buildMatch(primaryKeys: string[], row: Record<string, any> | undefined): Record<string, any> | null {
  if (!row || !primaryKeys.length) return null;
  const match: Record<string, any> = {};

  for (const key of primaryKeys) {
    if (!(key in row)) {
      return null;
    }
    match[key] = row[key];
  }

  return match;
}
