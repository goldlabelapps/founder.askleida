export function normalizeLeidaRouteKey(route: string): string {
    const trimmed = (route || '').trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/api')) return trimmed;
    if (trimmed.startsWith('/')) return `/api${trimmed}`;
    return `/api/${trimmed}`;
}
