import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { makeRes } from '../../../../';

type T_Decision = 'queue' | 'delete';
type T_SelectionType = 'include' | 'exclude';

type T_QueueBulkBody = {
  practitioner_id?: string;
  decision?: T_Decision;
  q?: string;
  category?: string;
  brand?: string;
  selectionType?: T_SelectionType;
  selectionIds?: string[];
};

type T_JsonValue = string | number | boolean | null | T_JsonObject | T_JsonValue[];

type T_JsonObject = {
  [key: string]: T_JsonValue;
};

type T_SourceRow = {
  id: string;
  unique_key?: string | null;
  aw_product_id?: string | null;
  merchant_product_id?: string | null;
  [key: string]: unknown;
};

const tenant = process.env.NEXT_PUBLIC_TENANT;
const LOOKFANTASTIC_TABLE =
  process.env.AWIN_PRODUCTS_TABLE?.trim()
  || process.env.AWIN_LOOKFANTASTIC_TABLE?.trim()
  || 'products_awin';
const PRODUCT_QUEUE_TABLE = process.env.AWIN_PRODUCT_QUEUE_TABLE?.trim() || 'product_queue';
const TABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const BULK_MAX = Number(process.env.AWIN_BULK_MAX || 5000);

function createSqlClient() {
  const databaseUrl =
    process.env.DATABASE_URL
    || process.env.POSTGRES_URL
    || process.env.SUPABASE_DB_URL;

  if (!databaseUrl?.trim()) {
    throw new Error('Missing database connection string. Set DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL.');
  }

  return postgres(databaseUrl.trim(), {
    prepare: false,
    onnotice: () => undefined,
  });
}

function assertSafeTableName(tableName: string) {
  if (!TABLE_NAME_PATTERN.test(tableName)) {
    throw new Error('Invalid configured table name');
  }
  return tableName;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeIdentifier(value: unknown): string | null {
  const text = normalizeText(value);
  if (text) return text;
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.floor(value));
  return null;
}

function parseDecision(value: unknown): T_Decision | null {
  return value === 'queue' || value === 'delete' ? value : null;
}

function parseSelectionType(value: unknown): T_SelectionType {
  return value === 'exclude' ? 'exclude' : 'include';
}

function parseSelectionIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((item) => normalizeText(item))
    .filter((item): item is string => Boolean(item));
  return Array.from(new Set(ids));
}

function buildSelectionFilter(
  sql: ReturnType<typeof createSqlClient>,
  selectionType: T_SelectionType,
  selectionIds: string[],
) {
  if (selectionIds.length === 0) {
    return selectionType === 'include' ? sql`false` : sql`true`;
  }

  const idMatchers = selectionIds.map((selectionId) => sql`
    products_awin_id::text = ${selectionId}
    or coalesce(slug, '') = ${selectionId}
    or coalesce(data->>'unique_key', '') = ${selectionId}
    or coalesce(data->>'aw_product_id', '') = ${selectionId}
    or coalesce(data->>'merchant_product_id', '') = ${selectionId}
  `);

  const matcher = idMatchers.slice(1).reduce((acc, clause) => sql`${acc} or ${clause}`, idMatchers[0]);
  return selectionType === 'include' ? matcher : sql`not ${matcher}`;
}

export async function POST(req: Request) {
  let body: T_QueueBulkBody;

  try {
    body = await req.json();
  } catch {
    const res = makeRes({ tenant, severity: 'error', message: 'Invalid JSON body' });
    return NextResponse.json(res, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    const res = makeRes({ tenant, severity: 'error', message: 'Request body must be a JSON object' });
    return NextResponse.json(res, { status: 400 });
  }

  const practitionerId = normalizeText(body.practitioner_id);
  if (!practitionerId) {
    const res = makeRes({ tenant, severity: 'error', message: 'practitioner_id is required' });
    return NextResponse.json(res, { status: 400 });
  }

  const decision = parseDecision(body.decision);
  if (!decision) {
    const res = makeRes({ tenant, severity: 'error', message: 'decision must be queue or delete' });
    return NextResponse.json(res, { status: 400 });
  }

  const selectionType = parseSelectionType(body.selectionType);
  const selectionIds = parseSelectionIds(body.selectionIds);
  const query = normalizeText(body.q)?.toLowerCase() || '';
  const category = normalizeText(body.category)?.toLowerCase() || '';
  const brand = normalizeText(body.brand)?.toLowerCase() || '';

  const safeSourceTable = assertSafeTableName(LOOKFANTASTIC_TABLE);
  const safeQueueTable = assertSafeTableName(PRODUCT_QUEUE_TABLE);
  const sql = createSqlClient();

  try {
    const like = `%${query}%`;
    const productNameExpr = sql`coalesce(data->>'product_name', data->>'name', data->>'title', '')`;
    const categoryExpr = sql`coalesce(data->>'category_name', data->>'category', '')`;
    const brandExpr = sql`coalesce(data->>'brand_name', '')`;
    const queryFilter = query
      ? sql`lower(${productNameExpr}) like ${like}`
      : sql`true`;
    const categoryFilter = category
      ? sql`lower(${categoryExpr}) = ${category}`
      : sql`true`;
    const brandFilter = brand
      ? sql`lower(${brandExpr}) = ${brand}`
      : sql`true`;
    const selectionFilter = buildSelectionFilter(sql, selectionType, selectionIds);
    const whereClause = sql`${queryFilter} and ${categoryFilter} and ${brandFilter} and ${selectionFilter}`;

    const sourceRows = await sql<Array<T_SourceRow>>`
      select
        products_awin_id::text as id,
        data->>'unique_key' as unique_key,
        data->>'aw_product_id' as aw_product_id,
        data->>'merchant_product_id' as merchant_product_id,
        to_jsonb(public.${sql(safeSourceTable)}.*) as data
      from public.${sql(safeSourceTable)}
      where ${whereClause}
      order by created asc
      limit ${Math.max(1, BULK_MAX)}
    `;

    if (!sourceRows.length) {
      const res = makeRes({
        tenant,
        severity: 'success',
        message: 'No matching AWIN source rows found for this selection',
        data: {
          decision,
          matchedRows: 0,
          queuedRows: 0,
          deletedRows: 0,
          skippedRows: 0,
          limited: false,
        },
      });
      return NextResponse.json(res);
    }

    let queuedRows = 0;
    let skippedRows = 0;

    if (decision === 'queue') {
      for (const row of sourceRows) {
        const rowData = ((row as Record<string, unknown>).data || {}) as T_JsonObject;
        const sourceProductId = normalizeText(rowData.product_name)
          || normalizeText(rowData.title)
          || normalizeText(rowData.name)
          || normalizeIdentifier(rowData.aw_product_id)
          || normalizeIdentifier(rowData.merchant_product_id)
          || normalizeIdentifier(rowData.id)
          || normalizeIdentifier(rowData.unique_key);

        const inserted = await sql<Array<Record<string, unknown>>>`
          insert into public.${sql(safeQueueTable)}
            (
              practitioner_id,
              source,
              source_table,
              source_product_id,
              decision,
              status,
              data
            )
          values
            (
              ${practitionerId}::uuid,
              'awin',
              ${safeSourceTable},
              ${sourceProductId},
              ${decision},
              'pending',
              ${sql.json(rowData)}
            )
          on conflict do nothing
          returning id
        `;

        if (inserted.length > 0) {
          queuedRows += 1;
        } else {
          skippedRows += 1;
        }
      }
    }

    const sourceIds = sourceRows
      .map((row) => normalizeText(row.id))
      .filter((id): id is string => Boolean(id));
    let sourceRowsChanged = 0;

    if (sourceIds.length > 0) {
      const idMatchers = sourceIds.map((id) => sql`products_awin_id::text = ${id}`);
      const idFilter = idMatchers.slice(1).reduce((acc, clause) => sql`${acc} or ${clause}`, idMatchers[0]);
      const queueStatus = decision === 'queue' ? 'queued' : 'skipped';
      const updated = await sql<Array<{ id: string }>>`
        update public.${sql(safeSourceTable)}
        set data = coalesce(data, '{}'::jsonb) || jsonb_build_object(
          'queue_status', ${queueStatus}::text,
          'queue_status_updated_at', now()
        )
        where ${idFilter}
        returning products_awin_id::text as id
      `;
      sourceRowsChanged = updated.length;
    }

    const limited = sourceRows.length >= Math.max(1, BULK_MAX);
    const message = decision === 'queue'
      ? `Queued ${queuedRows} rows and marked ${sourceRowsChanged} as queued in AWIN source${skippedRows ? ` (${skippedRows} already queued)` : ''}`
      : `Marked ${sourceRowsChanged} rows as skipped in AWIN source`;

    const res = makeRes({
      tenant,
      severity: 'success',
      message,
      data: {
        decision,
        matchedRows: sourceRows.length,
        queuedRows,
        sourceRowsChanged,
        skippedRows,
        limited,
      },
    });

    return NextResponse.json(res);
  } catch (error) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: error instanceof Error ? error.message : 'Unknown bulk queue processing error',
    });

    return NextResponse.json(res, { status: 500 });
  } finally {
    await sql.end({ timeout: 5 });
  }
}