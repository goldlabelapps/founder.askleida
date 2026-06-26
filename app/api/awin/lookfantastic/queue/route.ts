import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { makeRes } from '../../../';

type T_Decision = 'queue' | 'delete';

type T_JsonValue = string | number | boolean | null | T_JsonObject | T_JsonValue[];

type T_JsonObject = {
  [key: string]: T_JsonValue;
};

type T_QueueBody = {
  practitioner_id?: string;
  decision?: T_Decision;
  awinProduct?: T_JsonObject;
};

type T_PgError = {
  code?: string;
};

const tenant = process.env.NEXT_PUBLIC_TENANT;
const LOOKFANTASTIC_TABLE = process.env.AWIN_LOOKFANTASTIC_TABLE?.trim() || 'awin_lookfantastic';
const PRODUCT_QUEUE_TABLE = process.env.AWIN_PRODUCT_QUEUE_TABLE?.trim() || 'product_queue';
const TABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

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

  const awinProduct = body.awinProduct;
  if (!awinProduct || typeof awinProduct !== 'object' || Array.isArray(awinProduct)) {
    const res = makeRes({ tenant, severity: 'error', message: 'awinProduct object is required' });
    return NextResponse.json(res, { status: 400 });
  }

  const safeSourceTable = assertSafeTableName(LOOKFANTASTIC_TABLE);
  const safeQueueTable = assertSafeTableName(PRODUCT_QUEUE_TABLE);
  const sql = createSqlClient();

  try {
    const sourceProductId = normalizeIdentifier(awinProduct.aw_product_id)
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

    let deletedRows = 0;
    let deleteBy: string | null = null;

    if (decision === 'delete') {
      const rowId = parseProductId((awinProduct as Record<string, unknown>).id);
      const uniqueKey = normalizeText((awinProduct as Record<string, unknown>).unique_key);
      const awProductId = normalizeText((awinProduct as Record<string, unknown>).aw_product_id);
      const merchantProductId = normalizeText((awinProduct as Record<string, unknown>).merchant_product_id);

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
    }

    const res = makeRes({
      tenant,
      severity: 'success',
      message: existingPending
        ? 'Pending queue decision already exists for this product'
        : decision === 'delete'
          ? 'Deleted matching source product rows'
          : 'Queued product for processing',
      data: {
        decision,
        queue: queueRow,
        existingPending,
        sourceTable: safeSourceTable,
        deletedRows,
        deleteBy,
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
