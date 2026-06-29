import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeRes } from '../../';
import { assertSafeTableName, createSqlClient } from '../../supabase/lib/shared';

type T_SelectionType = 'include' | 'exclude';

type T_DeleteQueueBody = {
  q?: string;
  status?: string;
  deleteAll?: boolean;
  selection?: {
    type?: T_SelectionType;
    ids?: string[];
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenant = process.env.NEXT_PUBLIC_TENANT;
const PRODUCT_QUEUE_TABLE = process.env.AWIN_PRODUCT_QUEUE_TABLE?.trim() || 'product_queue';
const AWIN_PRODUCTS_TABLE =
  process.env.AWIN_PRODUCTS_TABLE?.trim()
  || process.env.AWIN_LOOKFANTASTIC_TABLE?.trim()
  || 'products_awin';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const MAX_DELETE_FETCH = 5000;

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
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
  let body: T_DeleteQueueBody;

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
  const status = normalizeText(body.status);
  const deleteAll = body.deleteAll === true;
  const selectionType = parseSelectionType(body.selection?.type);
  const selectionIds = parseSelectionIds(body.selection?.ids);

  if (deleteAll) {
    let sql;

    try {
      sql = createSqlClient();
      const safeTable = assertSafeTableName(AWIN_PRODUCTS_TABLE);
      await sql`truncate table public.${sql(safeTable)}`;

      const res = makeRes({
        tenant,
        message: `Truncated ${safeTable}`,
        severity: 'success',
        data: {
          deletedRows: 0,
          deletedAll: true,
        },
      });

      return NextResponse.json(res);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to truncate products_awin';
      const res = makeRes({ tenant, message, severity: 'error' });
      return NextResponse.json(res, { status: 500 });
    } finally {
      if (sql) {
        await sql.end({ timeout: 5 });
      }
    }
  }

  let selectQuery = supabase
    .from(PRODUCT_QUEUE_TABLE)
    .select('queue_id')
    .order('created', { ascending: true })
    .limit(MAX_DELETE_FETCH);

  if (status) {
    selectQuery = selectQuery.eq('status', status);
  }

  if (q) {
    selectQuery = selectQuery.or([
      `source_product_id.ilike.%${q}%`,
      `source_table.ilike.%${q}%`,
      `status.ilike.%${q}%`,
      `decision.ilike.%${q}%`,
    ].join(','));
  }

  const { data: matchedRows, error: selectError } = await selectQuery;

  if (selectError) {
    const res = makeRes({ tenant, message: selectError.message, severity: 'error' });
    return NextResponse.json(res, { status: 500 });
  }

  const matchedIds = (Array.isArray(matchedRows) ? matchedRows : [])
    .map((row) => normalizeText((row as { queue_id?: unknown })?.queue_id))
    .filter((id) => Boolean(id));

  const selectedIdSet = new Set(selectionIds);
  const targetIds = selectionType === 'exclude'
    ? matchedIds.filter((id) => !selectedIdSet.has(id))
    : matchedIds.filter((id) => selectedIdSet.has(id));

  if (!targetIds.length) {
    const res = makeRes({
      tenant,
      message: 'No matching queue items selected for deletion',
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
    .from(PRODUCT_QUEUE_TABLE)
    .delete()
    .in('queue_id', targetIds)
    .select('queue_id');

  if (deleteError) {
    const res = makeRes({ tenant, message: deleteError.message, severity: 'error' });
    return NextResponse.json(res, { status: 500 });
  }

  const deletedCount = Array.isArray(deletedRows) ? deletedRows.length : 0;
  const res = makeRes({
    tenant,
    message: `Deleted ${deletedCount} queue item${deletedCount === 1 ? '' : 's'}`,
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
