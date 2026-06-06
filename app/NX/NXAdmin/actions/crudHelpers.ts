import { supabase } from '../../lib/supabase';

type CollectionQueryOptions = {
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    searchTerm?: string;
};

function normalizeSearchValue(value: unknown) {
    if (typeof value !== 'string') return '';
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function matchesSearchTerm(doc: Record<string, unknown>, searchTerm?: string) {
    const normalizedTerm = normalizeSearchValue(searchTerm ?? '');
    if (!normalizedTerm) return true;

    const fullNameFromParts = [
        doc.first_name,
        doc.firstName,
        doc.last_name,
        doc.lastName,
    ].filter((value) => typeof value === 'string' && value.trim().length > 0).join(' ');

    const candidates = [
        doc.id,
        doc.name,
        doc.fullname,
        doc.fullName,
        doc.full_name,
        fullNameFromParts,
        doc.email,
        doc.company,
    ];

    return candidates.some((value) => {
        const normalizedCandidate = normalizeSearchValue(value);
        if (!normalizedCandidate) return false;
        return normalizedCandidate.includes(normalizedTerm);
    });
}

function parseCollectionRows(rows: any[]) {
    const docs: any[] = [];
    let typescriptDoc: any = null;

    rows.forEach((row: any) => {
        if (row.id === 'typescript') {
            typescriptDoc = row;
        } else {
            docs.push(row);
        }
    });

    return { docs, typescript: typescriptDoc };
}

async function fetchRows(
    collectionName: string,
    options: CollectionQueryOptions = {},
) {
    let query = supabase.from(collectionName).select('*');

    if (options.orderByField) {
        query = query.order(options.orderByField, {
            ascending: (options.orderDirection ?? 'asc') === 'asc',
        });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

function parseAndFilter(rows: any[], options: CollectionQueryOptions = {}) {
    const parsed = parseCollectionRows(rows);
    return {
        ...parsed,
        docs: parsed.docs.filter((doc) => matchesSearchTerm(doc, options.searchTerm)),
    };
}

export async function fetchCollectionDocs(
    collectionName: string,
    options: CollectionQueryOptions = {},
) {
    const rows = await fetchRows(collectionName, options);
    return parseAndFilter(rows, options);
}

export function subscribeToCollectionDocs(
    collectionName: string,
    onDocs: (docs: any[], typescript: any) => void,
    options: CollectionQueryOptions = {},
) {
    let cancelled = false;

    const load = async () => {
        try {
            const rows = await fetchRows(collectionName, options);
            const { docs, typescript } = parseAndFilter(rows, options);
            if (!cancelled) {
                onDocs(docs, typescript);
            }
        } catch {
            if (!cancelled) {
                onDocs([], null);
            }
        }
    };

    load();
    const intervalId = setInterval(load, 5000);

    return () => {
        cancelled = true;
        clearInterval(intervalId);
    };
}
