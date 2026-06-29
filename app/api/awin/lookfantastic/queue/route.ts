import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { makeRes } from '../../../';

type T_Decision = 'queue' | 'delete';
type T_OrderByKey = 'id' | 'created_at' | 'product_name' | 'category_name' | 'search_price' | 'brand';
type T_SelectionType = 'include' | 'exclude';

type T_JsonValue = string | number | boolean | null | T_JsonObject | T_JsonValue[];

type T_JsonObject = {
  [key: string]: T_JsonValue;
};

type T_AwinQueryInput = {
  q?: string;
  category?: string;
  brand?: string;
  orderBy?: T_OrderByKey | string;
  orderDir?: 'asc' | 'desc' | string;
};

type T_SelectionInput = {
  type?: T_SelectionType;
  ids?: string[];
};

type T_QueueBody = {
  practitioner_id?: string;
  decision?: T_Decision;
  awinProduct?: T_JsonObject;
  awinQuery?: T_AwinQueryInput;
  selection?: T_SelectionInput;
};

type T_PgError = {
  code?: string;
};

type T_ProcessResult = {
  existingPending: boolean;
  queueRow: Record<string, unknown> | null;
  sourceRowsChanged: number;
  sourceChangeBy: string | null;
  sourceAction: 'updated';
};

const tenant = process.env.NEXT_PUBLIC_TENANT;
const LOOKFANTASTIC_TABLE =
  process.env.AWIN_PRODUCTS_TABLE?.trim()
  || process.env.AWIN_LOOKFANTASTIC_TABLE?.trim()
  || 'products_awin';
const PRODUCT_QUEUE_TABLE = process.env.AWIN_PRODUCT_QUEUE_TABLE?.trim() || 'product_queue';
const TABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const text = normalizeText(value);
    if (text) {
      return text;
    }
  }

  return null;
}

function normalizeIdentifier(value: unknown): string | null {
  const text = normalizeText(value);
  if (text) {
    return text;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.floor(value));
  }

  return null;
}

function parseDecision(value: unknown): T_Decision | null {
  return value === 'queue' || value === 'delete' ? value : null;
}

function parseSourceId(value: unknown): string | null {
  const text = normalizeText(value);
  if (!text) {
    return null;
  }

  return UUID_PATTERN.test(text) ? text : null;
}

function isPgError(value: unknown): value is T_PgError {
  return typeof value === 'object' && value !== null;
}

function parseOrderBy(value: unknown): T_OrderByKey {
  const input = normalizeText(value)?.toLowerCase() || '';
  if (input === 'brand') return 'brand';
  if (input === 'id') return 'id';
  if (input === 'product_name') return 'product_name';
  if (input === 'category_name') return 'category_name';
  if (input === 'search_price') return 'search_price';
  return 'created_at';
}

function parseOrderDir(value: unknown) {
  return normalizeText(value)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
}

function combineOrClauses(
  sql: ReturnType<typeof createSqlClient>,
  clauses: any[],
) {
  if (!clauses.length) {
    return sql`false`;
  }

  return clauses.slice(1).reduce((acc, clause) => sql`${acc} or ${clause}`, clauses[0]);
}

function toJsonObject(value: unknown): T_JsonObject {
  const parsed = JSON.parse(JSON.stringify(value ?? {})) as unknown;
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as T_JsonObject;
  }
  return {};
}

function buildSelectionClause(
  sql: ReturnType<typeof createSqlClient>,
  selection?: T_SelectionInput,
) {
  const type: T_SelectionType = selection?.type === 'exclude' ? 'exclude' : 'include';
  const ids = Array.isArray(selection?.ids)
    ? selection.ids.map((value) => normalizeText(value)).filter((value): value is string => Boolean(value))
    : [];

  if (!ids.length) {
    return {
      type,
      ids,
      clause: type === 'exclude' ? sql`true` : null,
    };
  }

  const idClauses = ids.map((id) => sql`
    products_awin_id::text = ${id}
    or coalesce(slug, '') = ${id}
    or coalesce(data->>'unique_key', '') = ${id}
    or coalesce(data->>'aw_product_id', '') = ${id}
    or coalesce(data->>'merchant_product_id', '') = ${id}
  `);
  const anyIdClause = combineOrClauses(sql, idClauses);

  return {
    type,
    ids,
    clause: type === 'exclude' ? sql`not (${anyIdClause})` : anyIdClause,
  };
}

async function fetchMatchingSourceRows(
  sql: ReturnType<typeof createSqlClient>,
  safeSourceTable: string,
  awinQuery: T_AwinQueryInput | undefined,
  selection: T_SelectionInput,
) {
  const query = normalizeText(awinQuery?.q)?.toLowerCase() || '';
  const category = normalizeText(awinQuery?.category)?.toLowerCase() || '';
  const brand = normalizeText(awinQuery?.brand)?.toLowerCase() || '';
  const orderBy = parseOrderBy(awinQuery?.orderBy);
  const orderDir = parseOrderDir(awinQuery?.orderDir);
  const direction = orderDir === 'asc' ? sql`asc` : sql`desc`;
  const normalizedLike = `%${query}%`;
  const productNameExpr = sql`coalesce(data->>'product_name', data->>'name', data->>'title', '')`;
  const categoryExpr = sql`coalesce(data->>'category_name', data->>'category', '')`;
  const brandExpr = sql`coalesce(data->>'brand_name', '')`;
  const numericPriceExpr = sql`
    case
      when nullif(regexp_replace(coalesce(data->>'search_price', data->>'price', ''), '[^0-9.-]', '', 'g'), '') ~ '^-?[0-9]+(\\.[0-9]+)?$'
        then (nullif(regexp_replace(coalesce(data->>'search_price', data->>'price', ''), '[^0-9.-]', '', 'g'), ''))::numeric
      else null
    end
  `;

  const filter = query
    ? sql`(
        lower(${productNameExpr}) like ${normalizedLike}
      )`
    : sql`true`;

  const categoryFilter = category
    ? sql`lower(${categoryExpr}) = ${category}`
    : sql`true`;

  const brandFilter = brand
    ? sql`lower(${brandExpr}) = ${brand}`
    : sql`true`;

  const selectionFilter = buildSelectionClause(sql, selection);
  if (selectionFilter.type === 'include' && !selectionFilter.ids.length) {
    return {
      rows: [] as Array<Record<string, unknown>>,
      selectionType: selectionFilter.type,
      selectionIds: selectionFilter.ids,
    };
  }

  const whereClause = selectionFilter.clause
    ? sql`${filter} and ${categoryFilter} and ${brandFilter} and ${selectionFilter.clause}`
    : sql`${filter} and ${categoryFilter} and ${brandFilter}`;

  const rowsBase = sql`
    select
      products_awin_id as id,
      slug,
      ${productNameExpr} as product_name,
      nullif(coalesce(data->>'description', ''), '') as description,
      nullif(${categoryExpr}, '') as category_name,
      ${numericPriceExpr} as search_price,
      nullif(coalesce(data->>'currency', ''), '') as currency,
      nullif(coalesce(data->>'ean', ''), '') as ean,
      nullif(coalesce(data->>'aw_product_id', ''), '') as aw_product_id,
      nullif(coalesce(data->>'merchant_product_id', ''), '') as merchant_product_id,
      nullif(coalesce(data->>'aw_deep_link', data->>'deeplink', ''), '') as aw_deep_link,
      created as created_at,
      data
    from public.${sql(safeSourceTable)}
    where ${whereClause}
  `;

  const rows = orderBy === 'brand'
    ? await sql<Array<Record<string, unknown>>>`
        ${rowsBase}
        order by lower(${brandExpr}) ${direction}, created ${direction}
      `
    : orderBy === 'id'
    ? await sql<Array<Record<string, unknown>>>`
        ${rowsBase}
        order by products_awin_id ${direction}
      `
    : orderBy === 'product_name'
    ? await sql<Array<Record<string, unknown>>>`
        ${rowsBase}
        order by lower(${productNameExpr}) ${direction}, created ${direction}
      `
    : orderBy === 'category_name'
    ? await sql<Array<Record<string, unknown>>>`
        ${rowsBase}
        order by lower(${categoryExpr}) ${direction}, created ${direction}
      `
    : orderBy === 'search_price'
    ? await sql<Array<Record<string, unknown>>>`
        ${rowsBase}
        order by ${numericPriceExpr} ${direction} nulls last, created ${direction}
      `
    : await sql<Array<Record<string, unknown>>>`
        ${rowsBase}
        order by created ${direction}
      `;

  return {
    rows,
    selectionType: selectionFilter.type,
    selectionIds: selectionFilter.ids,
  };
}

async function updateSourceProductQueueStatus(
  sql: ReturnType<typeof createSqlClient>,
  safeSourceTable: string,
  status: string,
  awinProduct: T_JsonObject,
) {
  let changedRows = 0;
  let updateBy: string | null = null;

  const nested = (awinProduct.data as T_JsonObject | undefined) || {};
  const rowId = parseSourceId(awinProduct.id);
  const uniqueKey = firstText(awinProduct.unique_key, nested.unique_key);
  const awProductId = firstText(awinProduct.aw_product_id, nested.aw_product_id);
  const merchantProductId = firstText(awinProduct.merchant_product_id, nested.merchant_product_id);
  const slug = firstText(awinProduct.slug, nested.slug);

  if (rowId) {
    const rows = await sql<Array<Record<string, unknown>>>`
      update public.${sql(safeSourceTable)}
      set data = coalesce(data, '{}'::jsonb) || jsonb_build_object(
        'queue_status', ${status}::text,
        'queue_status_updated_at', now()
      )
      where products_awin_id = ${rowId}::uuid
      returning products_awin_id
    `;
    changedRows = rows.length;
    updateBy = 'id';
  } else if (uniqueKey) {
    const rows = await sql<Array<Record<string, unknown>>>`
      update public.${sql(safeSourceTable)}
      set data = coalesce(data, '{}'::jsonb) || jsonb_build_object(
        'queue_status', ${status}::text,
        'queue_status_updated_at', now()
      )
      where coalesce(data->>'unique_key', '') = ${uniqueKey}
      returning products_awin_id
    `;
    changedRows = rows.length;
    updateBy = 'unique_key';
  } else if (awProductId) {
    const rows = await sql<Array<Record<string, unknown>>>`
      update public.${sql(safeSourceTable)}
      set data = coalesce(data, '{}'::jsonb) || jsonb_build_object(
        'queue_status', ${status}::text,
        'queue_status_updated_at', now()
      )
      where coalesce(data->>'aw_product_id', '') = ${awProductId}
      returning products_awin_id
    `;
    changedRows = rows.length;
    updateBy = 'aw_product_id';
  } else if (merchantProductId) {
    const rows = await sql<Array<Record<string, unknown>>>`
      update public.${sql(safeSourceTable)}
      set data = coalesce(data, '{}'::jsonb) || jsonb_build_object(
        'queue_status', ${status}::text,
        'queue_status_updated_at', now()
      )
      where coalesce(data->>'merchant_product_id', '') = ${merchantProductId}
      returning products_awin_id
    `;
    changedRows = rows.length;
    updateBy = 'merchant_product_id';
  } else if (slug) {
    const rows = await sql<Array<Record<string, unknown>>>`
      update public.${sql(safeSourceTable)}
      set data = coalesce(data, '{}'::jsonb) || jsonb_build_object(
        'queue_status', ${status}::text,
        'queue_status_updated_at', now()
      )
      where coalesce(slug, '') = ${slug}
      returning products_awin_id
    `;
    changedRows = rows.length;
    updateBy = 'slug';
  }

  return { changedRows, updateBy };
}

async function processSingleAwinProduct({
  sql,
  safeSourceTable,
  safeQueueTable,
  practitionerId,
  decision,
  awinProduct,
}: {
  sql: ReturnType<typeof createSqlClient>;
  safeSourceTable: string;
  safeQueueTable: string;
  practitionerId: string;
  decision: T_Decision;
  awinProduct: T_JsonObject;
}): Promise<T_ProcessResult> {
  const sourceProductId = firstText(
    awinProduct.product_name,
    awinProduct.title,
    awinProduct.name,
    (awinProduct.data as T_JsonObject | undefined)?.product_name,
    (awinProduct.data as T_JsonObject | undefined)?.title,
    (awinProduct.data as T_JsonObject | undefined)?.name,
    (awinProduct.product_basic as T_JsonObject | undefined)?.title,
    (awinProduct.product_basic as T_JsonObject | undefined)?.name,
  ) || normalizeIdentifier(awinProduct.aw_product_id)
    || normalizeIdentifier(awinProduct.merchant_product_id)
    || normalizeIdentifier(awinProduct.id)
    || normalizeIdentifier(awinProduct.unique_key);

  let existingPending = false;
  let queueRow: Record<string, unknown> | null = null;

  if (decision === 'queue') {
    try {
      const queueRows = await sql<Array<Record<string, unknown>>>`
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
            ${sql.json(awinProduct)}
          )
        returning *
      `;
      queueRow = queueRows[0] || null;
    } catch (error) {
      if (isPgError(error) && error.code === '23505' && sourceProductId) {
        const existingRows = await sql<Array<Record<string, unknown>>>`
          select *
          from public.${sql(safeQueueTable)}
          where practitioner_id = ${practitionerId}::uuid
            and source = 'awin'
            and source_table = ${safeSourceTable}
            and source_product_id = ${sourceProductId}
            and decision = ${decision}
            and status = 'pending'
          order by created desc
          limit 1
        `;

        if (existingRows[0]) {
          queueRow = existingRows[0];
          existingPending = true;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  const sourceStatus = decision === 'queue' ? 'queued' : 'skipped';
  const sourceResult = await updateSourceProductQueueStatus(sql, safeSourceTable, sourceStatus, awinProduct);

  return {
    existingPending,
    queueRow,
    sourceRowsChanged: sourceResult.changedRows,
    sourceChangeBy: sourceResult.updateBy,
    sourceAction: 'updated',
  };
}

export async function POST(req: Request) {
  let body: T_QueueBody;

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

  const safeSourceTable = assertSafeTableName(LOOKFANTASTIC_TABLE);
  const safeQueueTable = assertSafeTableName(PRODUCT_QUEUE_TABLE);
  const sql = createSqlClient();

  try {
    const awinProduct = body.awinProduct;
    if (awinProduct && typeof awinProduct === 'object' && !Array.isArray(awinProduct)) {
      const result = await processSingleAwinProduct({
        sql,
        safeSourceTable,
        safeQueueTable,
        practitionerId,
        decision,
        awinProduct,
      });

      const res = makeRes({
        tenant,
        severity: 'success',
        message: result.existingPending
          ? 'Pending queue decision already exists for this product and the source row was marked as queued'
          : decision === 'delete'
            ? 'Marked matching source product rows as skipped'
            : 'Queued product for processing and marked source row as queued',
        data: {
          decision,
          queue: result.queueRow,
          existingPending: result.existingPending,
          sourceTable: safeSourceTable,
          sourceRowsChanged: result.sourceRowsChanged,
          sourceChangeBy: result.sourceChangeBy,
          sourceAction: result.sourceAction,
        },
      });

      return NextResponse.json(res);
    }

    if (!body.selection) {
      const res = makeRes({ tenant, severity: 'error', message: 'awinProduct or selection is required' });
      return NextResponse.json(res, { status: 400 });
    }

    const { rows, selectionType, selectionIds } = await fetchMatchingSourceRows(
      sql,
      safeSourceTable,
      body.awinQuery,
      body.selection,
    );

    let processedCount = 0;
    let existingPendingCount = 0;
    let sourceRowsChanged = 0;

    for (const row of rows) {
      const result = await processSingleAwinProduct({
        sql,
        safeSourceTable,
        safeQueueTable,
        practitionerId,
        decision,
        awinProduct: toJsonObject(row),
      });

      processedCount += 1;
      sourceRowsChanged += result.sourceRowsChanged;
      if (result.existingPending) {
        existingPendingCount += 1;
      }
    }

    const res = makeRes({
      tenant,
      severity: 'success',
      message: decision === 'queue'
        ? `Queued ${processedCount} product${processedCount === 1 ? '' : 's'} and marked them as queued in the source table`
        : `Marked ${processedCount} product${processedCount === 1 ? '' : 's'} as skipped in the source table`,
      data: {
        decision,
        sourceTable: safeSourceTable,
        matchedCount: rows.length,
        processedCount,
        existingPendingCount,
        sourceRowsChanged,
        selection: {
          type: selectionType,
          idsCount: selectionIds.length,
        },
      },
    });

    return NextResponse.json(res);
  } catch (error) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: error instanceof Error ? error.message : 'Unknown queue processing error',
    });

    return NextResponse.json(res, { status: 500 });
  } finally {
    await sql.end({ timeout: 5 });
  }
}
