import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../../';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PRODUCT_QUEUE_TABLE = process.env.AWIN_PRODUCT_QUEUE_TABLE?.trim() || 'product_queue';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
const SORT_FIELDS = ['created', 'updated', 'status', 'decision', 'source_table'] as const;

type T_SortField = (typeof SORT_FIELDS)[number];

function parseInteger(value: string | null, fallback: number, options: { min: number; max: number }) {
  const parsed = value ? Number(value) : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  return Math.min(Math.max(rounded, options.min), options.max);
}

function parseSortField(value: string | null): T_SortField {
  if (!value) return 'created';
  const normalized = value.trim();
  if ((SORT_FIELDS as readonly string[]).includes(normalized)) {
    return normalized as T_SortField;
  }
  return 'created';
}

function parseSortOrder(value: string | null): 'asc' | 'desc' {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'asc') return 'asc';
  return 'desc';
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
  const status = url?.searchParams.get('status')?.trim() || '';
  const decision = url?.searchParams.get('decision')?.trim() || '';
  const practitionerId = url?.searchParams.get('practitioner_id')?.trim() || '';
  const q = url?.searchParams.get('q')?.trim() || '';

  let query = supabase.from(PRODUCT_QUEUE_TABLE).select('*', { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  if (decision) {
    query = query.eq('decision', decision);
  }

  if (practitionerId) {
    query = query.eq('practitioner_id', practitionerId);
  }

  if (q) {
    query = query.or([
      `source_product_id.ilike.%${q}%`,
      `source_table.ilike.%${q}%`,
      `status.ilike.%${q}%`,
      `decision.ilike.%${q}%`,
    ].join(','));
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

  const res = makeRes({
    severity: 'success',
    message: 'Fetched product queue',
    data: {
      page,
      pageSize,
      total,
      totalPages,
      sortBy,
      sortOrder,
      filters: {
        status: status || undefined,
        decision: decision || undefined,
        practitioner_id: practitionerId || undefined,
        q: q || undefined,
      },
      rows: Array.isArray(data) ? data : [],
    },
  });

  return NextResponse.json(res);
}