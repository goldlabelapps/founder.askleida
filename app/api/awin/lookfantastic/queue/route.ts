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
  deletedRows: number;
  deleteBy: string | null;
};

const tenant = process.env.NEXT_PUBLIC_TENANT;
const LOOKFANTASTIC_TABLE = process.env.AWIN_LOOKFANTASTIC_TABLE?.trim() || 'awin_lookfantastic';
const PRODUCT_QUEUE_TABLE = process.env.AWIN_PRODUCT_QUEUE_TABLE?.trim() || 'product_queue';
const TABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ORDER_BY_MAP = {
  id: 'id',
  created_at: 'created_at',
  product_name: 'product_name',
  category_name: 'category_name',
  search_price: 'search_price',
} as const;

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

function parseProductId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.floor(value);
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }

  return null;
}

function isPgError(value: unknown): value is T_PgError {
  return typeof value === 'object' && value !== null;
}

function parseOrderBy(value: unknown): T_OrderByKey {
  const input = normalizeText(value)?.toLowerCase() || '';
  if (input === 'brand') return 'brand';
  return (input in ORDER_BY_MAP ? input : 'created_at') as T_OrderByKey;
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

  const idClauses = ids.map((id) => sql`id::text = ${id}`);
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

  const filter = query
    ? sql`(
        lower(coalesce(product_name, '')) like ${normalizedLike}
      )`
    : sql`true`;

  const categoryFilter = category
    ? sql`lower(coalesce(category_name, '')) = ${category}`
    : sql`true`;

  const brandFilter = brand
    ? sql`lower(coalesce(data->>'brand_name', '')) = ${brand}`
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

  const rows = orderBy === 'brand'
    ? await sql<Array<Record<string, unknown>>>`
        select
          id,
          unique_key,
          product_name,
          description,
          category_name,
          search_price,
          currency,
          ean,
          aw_product_id,
          merchant_product_id,
          aw_deep_link,
          created_at,
          data
        from public.${sql(safeSourceTable)}
        where ${whereClause}
        order by lower(coalesce(data->>'brand_name', '')) ${direction}
      `
    : await sql<Array<Record<string, unknown>>>`
        select
          id,
          unique_key,
          product_name,
          description,
          category_name,
          search_price,
          currency,
          ean,
          aw_product_id,
          merchant_product_id,
          aw_deep_link,
          created_at,
          data
        from public.${sql(safeSourceTable)}
        where ${whereClause}
        order by ${sql(ORDER_BY_MAP[orderBy as keyof typeof ORDER_BY_MAP])} ${direction}
      `;

  return {
    rows,
    selectionType: selectionFilter.type,
    selectionIds: selectionFilter.ids,
  };
}

async function deleteSourceProduct(
  sql: ReturnType<typeof createSqlClient>,
  safeSourceTable: string,
  awinProduct: T_JsonObject,
) {
  let deletedRows = 0;
  let deleteBy: string | null = null;

  const rowId = parseProductId(awinProduct.id);
  const uniqueKey = normalizeText(awinProduct.unique_key);
  const awProductId = normalizeText(awinProduct.aw_product_id);
  const merchantProductId = normalizeText(awinProduct.merchant_product_id);

  if (rowId !== null) {
    const rows = await sql<Array<Record<string, unknown>>>`
      delete from public.${sql(safeSourceTable)}
      where id = ${rowId}
      returning id
    `;
    deletedRows = rows.length;
    deleteBy = 'id';
  } else if (uniqueKey) {
    const rows = await sql<Array<Record<string, unknown>>>`
      delete from public.${sql(safeSourceTable)}
      where unique_key = ${uniqueKey}
      returning id
    `;
    deletedRows = rows.length;
    deleteBy = 'unique_key';
  } else if (awProductId) {
    const rows = await sql<Array<Record<string, unknown>>>`
      delete from public.${sql(safeSourceTable)}
      where aw_product_id = ${awProductId}
      returning id
    `;
    deletedRows = rows.length;
    deleteBy = 'aw_product_id';
  } else if (merchantProductId) {
    const rows = await sql<Array<Record<string, unknown>>>`
      delete from public.${sql(safeSourceTable)}
      where merchant_product_id = ${merchantProductId}
      returning id
    `;
    deletedRows = rows.length;
    deleteBy = 'merchant_product_id';
  }

  return { deletedRows, deleteBy };
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

  const shouldDeleteSource = decision === 'delete' || decision === 'queue';
  const { deletedRows, deleteBy } = shouldDeleteSource
    ? await deleteSourceProduct(sql, safeSourceTable, awinProduct)
    : { deletedRows: 0, deleteBy: null };

  return {
    existingPending,
    queueRow,
    deletedRows,
    deleteBy,
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
          ? 'Pending queue decision already exists for this product and the source row was removed'
          : decision === 'delete'
            ? 'Deleted matching source product rows'
            : 'Queued product for processing and removed it from the source table',
        data: {
          decision,
          queue: result.queueRow,
          existingPending: result.existingPending,
          sourceTable: safeSourceTable,
          deletedRows: result.deletedRows,
          deleteBy: result.deleteBy,
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
    let deletedRows = 0;

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
      deletedRows += result.deletedRows;
      if (result.existingPending) {
        existingPendingCount += 1;
      }
    }

    const res = makeRes({
      tenant,
      severity: 'success',
      message: decision === 'queue'
        ? `Queued ${processedCount} product${processedCount === 1 ? '' : 's'} and removed them from the source table`
        : `Deleted ${processedCount} product${processedCount === 1 ? '' : 's'} from the source table`,
      data: {
        decision,
        sourceTable: safeSourceTable,
        matchedCount: rows.length,
        processedCount,
        existingPendingCount,
        deletedRows,
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
