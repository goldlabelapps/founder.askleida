import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;
const SORT_FIELDS = ['created', 'updated', 'title'] as const;

type T_SortField = (typeof SORT_FIELDS)[number];

type T_Filters = {
  practitioner_id?: string;
  q?: string;
  title?: string;
  created_from?: string;
  created_to?: string;
  updated_from?: string;
  updated_to?: string;
  has_data?: boolean;
  data_contains?: Record<string, unknown>;
};

function parseInteger(value: string | null, fallback: number, options: { min: number; max: number }) {
  const parsed = value ? Number(value) : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  return Math.min(Math.max(rounded, options.min), options.max);
}

function parseBoolean(value: string | null): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return undefined;
}

function parseIsoDate(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return undefined;
  return new Date(ms).toISOString();
}

function parseSortField(value: string | null): T_SortField {
  if (!value) return 'updated';
  const normalized = value.trim();
  if ((SORT_FIELDS as readonly string[]).includes(normalized)) {
    return normalized as T_SortField;
  }
  return 'updated';
}

function parseSortOrder(value: string | null): 'asc' | 'desc' {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'asc') return 'asc';
  return 'desc';
}

function parseDataContains(value: string | null): Record<string, unknown> | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function GET(req: Request) {
  const url = req?.url ? new URL(req.url) : null;
  const page = parseInteger(url?.searchParams.get('page') || null, DEFAULT_PAGE, { min: 1, max: 100000 });
  const pageSize = parseInteger(url?.searchParams.get('pageSize') || null, DEFAULT_PAGE_SIZE, {
    min: 1,
    max: MAX_PAGE_SIZE,
  });

  const sortBy = parseSortField(url?.searchParams.get('sortBy') || null);
  const sortOrder = parseSortOrder(url?.searchParams.get('sortOrder') || null);

  const practitionerId = url?.searchParams.get('practitioner_id')?.trim() || '';
  const q = url?.searchParams.get('q')?.trim() || '';
  const title = url?.searchParams.get('title')?.trim() || '';
  const createdFrom = parseIsoDate(url?.searchParams.get('created_from') || null);
  const createdTo = parseIsoDate(url?.searchParams.get('created_to') || null);
  const updatedFrom = parseIsoDate(url?.searchParams.get('updated_from') || null);
  const updatedTo = parseIsoDate(url?.searchParams.get('updated_to') || null);
  const hasData = parseBoolean(url?.searchParams.get('has_data') || null);
  const dataContainsRaw = url?.searchParams.get('data_contains') || null;
  const dataContains = parseDataContains(dataContainsRaw);

  if (dataContainsRaw && !dataContains) {
    const res = makeRes({
      severity: 'error',
      message: 'Invalid data_contains. Provide a JSON object string.',
      data: null,
    });
    return NextResponse.json(res, { status: 400 });
  }

  let query = supabase.from('products').select('*', { count: 'exact' });

  if (practitionerId) {
    query = query.eq('practitioner_id', practitionerId);
  }

  if (title) {
    query = query.ilike('title', `%${title}%`);
  }

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  if (createdFrom) {
    query = query.gte('created', createdFrom);
  }

  if (createdTo) {
    query = query.lte('created', createdTo);
  }

  if (updatedFrom) {
    query = query.gte('updated', updatedFrom);
  }

  if (updatedTo) {
    query = query.lte('updated', updatedTo);
  }

  if (hasData === true) {
    query = query.not('data', 'is', null);
  }

  if (hasData === false) {
    query = query.is('data', null);
  }

  if (dataContains) {
    query = query.contains('data', dataContains);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === 'asc', nullsFirst: false })
    .range(from, to);

  if (error) {
    const res = makeRes({ severity: 'error', message: error.message, data: null });
    return NextResponse.json(res, { status: 500 });
  }

  const total = typeof count === 'number' ? count : 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  const filters: T_Filters = {};
  if (practitionerId) filters.practitioner_id = practitionerId;
  if (q) filters.q = q;
  if (title) filters.title = title;
  if (createdFrom) filters.created_from = createdFrom;
  if (createdTo) filters.created_to = createdTo;
  if (updatedFrom) filters.updated_from = updatedFrom;
  if (updatedTo) filters.updated_to = updatedTo;
  if (typeof hasData === 'boolean') filters.has_data = hasData;
  if (dataContains) filters.data_contains = dataContains;

  const res = makeRes({
    severity: 'success',
    message: 'Fetched products',
    data: {
      page,
      pageSize,
      total,
      totalPages,
      sortBy,
      sortOrder,
      filters,
      rows: Array.isArray(data) ? data : [],
    },
  });

  return NextResponse.json(res);
}
