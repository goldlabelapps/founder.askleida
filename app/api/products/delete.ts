import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../';

type T_SelectionType = 'include' | 'exclude';

type T_DeleteProductsBody = {
  q?: string;
  selection?: {
    type?: T_SelectionType;
    ids?: string[];
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenant = process.env.NEXT_PUBLIC_TENANT;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const MAX_DELETE_FETCH = 5000;

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeIdentifier(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.floor(value));
  }

  return normalizeText(value);
}

function parseSelectionType(value: unknown): T_SelectionType {
  return value === 'exclude' ? 'exclude' : 'include';
}

function parseSelectionIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value
    .map((entry) => normalizeText(entry))
    .filter((entry) => Boolean(entry));

  return Array.from(new Set(ids));
}

export async function DELETE(req: Request) {
  let body: T_DeleteProductsBody;

  try {
    body = await req.json();
  } catch {
    const res = makeRes({ tenant, message: 'Invalid JSON body', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    const res = makeRes({ tenant, message: 'Request body must be a JSON object', severity: 'error' });
    return NextResponse.json(res, { status: 400 });
  }

  const q = normalizeText(body.q);
  const selectionType = parseSelectionType(body.selection?.type);
  const selectionIds = parseSelectionIds(body.selection?.ids);

  let selectQuery = supabase
    .from('products')
    .select('product_id')
    .order('product_id', { ascending: true })
    .limit(MAX_DELETE_FETCH);

  if (q) {
    selectQuery = selectQuery.ilike('title', `%${q}%`);
  }

  const { data: matchedRows, error: selectError } = await selectQuery;

  if (selectError) {
    const res = makeRes({ tenant, message: selectError.message, severity: 'error' });
    return NextResponse.json(res, { status: 500 });
  }

  const matchedIds = (Array.isArray(matchedRows) ? matchedRows : [])
    .map((row) => normalizeIdentifier((row as { product_id?: unknown })?.product_id))
    .filter((id) => Boolean(id));

  const selectedIdSet = new Set(selectionIds);
  const targetIds = selectionType === 'exclude'
    ? matchedIds.filter((id) => !selectedIdSet.has(id))
    : matchedIds.filter((id) => selectedIdSet.has(id));

  if (!targetIds.length) {
    const res = makeRes({
      tenant,
      message: 'No matching products selected for deletion',
      severity: 'success',
      data: {
        selectionType,
        matchedRows: matchedIds.length,
        deletedRows: 0,
        limited: matchedIds.length >= MAX_DELETE_FETCH,
      },
    });
    return NextResponse.json(res);
  }

  const { data: deletedRows, error: deleteError } = await supabase
    .from('products')
    .delete()
    .in('product_id', targetIds)
    .select('product_id');

  if (deleteError) {
    const res = makeRes({ tenant, message: deleteError.message, severity: 'error' });
    return NextResponse.json(res, { status: 500 });
  }

  const deletedCount = Array.isArray(deletedRows) ? deletedRows.length : 0;
  const res = makeRes({
    tenant,
    message: `Deleted ${deletedCount} product${deletedCount === 1 ? '' : 's'}`,
    severity: 'success',
    data: {
      selectionType,
      matchedRows: matchedIds.length,
      deletedRows: deletedCount,
      limited: matchedIds.length >= MAX_DELETE_FETCH,
    },
  });

  return NextResponse.json(res);
}
