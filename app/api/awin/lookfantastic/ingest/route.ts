import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { NextResponse } from 'next/server';
import { parse as parseCsv } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import postgres, { type Sql } from 'postgres';
import { makeRes } from '../../../';

const tenant = process.env.NEXT_PUBLIC_TENANT;
const LOOKFANTASTIC_SOURCE = 'lookfantastic';
const DEFAULT_SNAPSHOT_TABLE = process.env.AWIN_FEED_SYNC_TABLE?.trim() || 'awin_feed_snapshots';
const DEFAULT_TARGET_TABLE = process.env.AWIN_LOOKFANTASTIC_TABLE?.trim() || 'awin_looksfantastic';
const TABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

type T_SnapshotRow = {
  id: number;
  source: string;
  bucket: string;
  storage_path: string;
  created_at: string;
};

type T_RawRow = Record<string, unknown>;

type T_ProductRow = {
  unique_key: string;
  ean: string | null;
  upc: string | null;
  isbn: string | null;
  mpn: string | null;
  product_gtin: string | null;
  aw_product_id: string | null;
  merchant_product_id: string | null;
  product_name: string | null;
  description: string | null;
  aw_deep_link: string | null;
  merchant_deep_link: string | null;
  merchant_name: string | null;
  merchant_id: string | null;
  category_name: string | null;
  category_id: string | null;
  search_price: number | null;
  currency: string | null;
  stock_quantity: string | null;
  source_last_updated: string | null;
  snapshot_id: number;
  data: Record<string, unknown>;
};

function assertSafeTableName(value: string, label: string) {
  if (!TABLE_NAME_PATTERN.test(value)) {
    throw new Error(`${label} has invalid table name`);
  }
  return value;
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

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

function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const textValue = typeof value === 'string' ? value : String(value);
  const trimmed = textValue.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parsePrice(value: unknown): number | null {
  const text = normalizeText(value);
  if (!text) {
    return null;
  }

  const normalized = text.replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickUniqueValue(row: T_RawRow): string {
  const candidates = [
    normalizeText(row.ean),
    normalizeText(row.product_GTIN),
    normalizeText(row.upc),
    normalizeText(row.isbn),
    normalizeText(row.mpn),
    normalizeText(row.merchant_product_id),
    normalizeText(row.aw_product_id),
  ].filter((item): item is string => Boolean(item));

  if (candidates.length > 0) {
    return candidates[0].toLowerCase();
  }

  const signature = [
    normalizeText(row.aw_deep_link),
    normalizeText(row.product_name),
    normalizeText(row.merchant_id),
    normalizeText(row.category_name),
  ].filter((item): item is string => Boolean(item)).join('|');

  if (!signature) {
    throw new Error('Unable to derive unique key for a CSV row');
  }

  return createHash('sha256').update(signature).digest('hex');
}

function maybeGunzip(input: Buffer, storagePath: string): Buffer {
  const gzipMagic = input.length >= 2 && input[0] === 0x1f && input[1] === 0x8b;
  if (!gzipMagic && !storagePath.endsWith('.gz')) {
    return input;
  }

  try {
    return gunzipSync(input);
  } catch {
    return input;
  }
}

async function ensureTargetTable(sql: Sql, tableName: string) {
  await sql.unsafe(`
    create table if not exists public.${tableName} (
      id bigserial primary key,
      unique_key text not null,
      ean text,
      upc text,
      isbn text,
      mpn text,
      product_gtin text,
      aw_product_id text,
      merchant_product_id text,
      product_name text,
      description text,
      aw_deep_link text,
      merchant_deep_link text,
      merchant_name text,
      merchant_id text,
      category_name text,
      category_id text,
      search_price numeric,
      currency text,
      stock_quantity text,
      source_last_updated text,
      snapshot_id bigint,
      data jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint ${tableName}_unique_key_key unique (unique_key)
    );

    create index if not exists ${tableName}_snapshot_id_idx
      on public.${tableName} (snapshot_id);

    create index if not exists ${tableName}_ean_idx
      on public.${tableName} (ean);
  `);
}

async function getLatestSnapshot(sql: Sql, tableName: string) {
  const rows = await sql<T_SnapshotRow[]>`
    select id, source, bucket, storage_path, created_at
    from public.${sql(tableName)}
    where source = ${LOOKFANTASTIC_SOURCE}
      and status = 'saved'
    order by created_at desc
    limit 1
  `;

  return rows[0] || null;
}

function toProductRow(row: T_RawRow, snapshotId: number): T_ProductRow {
  return {
    unique_key: pickUniqueValue(row),
    ean: normalizeText(row.ean),
    upc: normalizeText(row.upc),
    isbn: normalizeText(row.isbn),
    mpn: normalizeText(row.mpn),
    product_gtin: normalizeText(row.product_GTIN),
    aw_product_id: normalizeText(row.aw_product_id),
    merchant_product_id: normalizeText(row.merchant_product_id),
    product_name: normalizeText(row.product_name),
    description: normalizeText(row.description),
    aw_deep_link: normalizeText(row.aw_deep_link),
    merchant_deep_link: normalizeText(row.merchant_deep_link),
    merchant_name: normalizeText(row.merchant_name),
    merchant_id: normalizeText(row.merchant_id),
    category_name: normalizeText(row.category_name),
    category_id: normalizeText(row.category_id),
    search_price: parsePrice(row.search_price),
    currency: normalizeText(row.currency),
    stock_quantity: normalizeText(row.stock_quantity),
    source_last_updated: normalizeText(row.last_updated),
    snapshot_id: snapshotId,
    data: row,
  };
}

async function upsertRows(sql: Sql, tableName: string, rows: T_ProductRow[]) {
  if (rows.length === 0) {
    return 0;
  }

  const chunkSize = 500;
  let processed = 0;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);

    await sql`
      insert into public.${sql(tableName)} ${sql(chunk, [
        'unique_key',
        'ean',
        'upc',
        'isbn',
        'mpn',
        'product_gtin',
        'aw_product_id',
        'merchant_product_id',
        'product_name',
        'description',
        'aw_deep_link',
        'merchant_deep_link',
        'merchant_name',
        'merchant_id',
        'category_name',
        'category_id',
        'search_price',
        'currency',
        'stock_quantity',
        'source_last_updated',
        'snapshot_id',
        'data',
      ])}
      on conflict (unique_key)
      do update set
        ean = excluded.ean,
        upc = excluded.upc,
        isbn = excluded.isbn,
        mpn = excluded.mpn,
        product_gtin = excluded.product_gtin,
        aw_product_id = excluded.aw_product_id,
        merchant_product_id = excluded.merchant_product_id,
        product_name = excluded.product_name,
        description = excluded.description,
        aw_deep_link = excluded.aw_deep_link,
        merchant_deep_link = excluded.merchant_deep_link,
        merchant_name = excluded.merchant_name,
        merchant_id = excluded.merchant_id,
        category_name = excluded.category_name,
        category_id = excluded.category_id,
        search_price = excluded.search_price,
        currency = excluded.currency,
        stock_quantity = excluded.stock_quantity,
        source_last_updated = excluded.source_last_updated,
        snapshot_id = excluded.snapshot_id,
        data = excluded.data,
        updated_at = now()
    `;

    processed += chunk.length;
  }

  return processed;
}

function parseOptionalLimit(value: string | null, fallback: number | null) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

async function runIngest(req: Request) {
  const url = new URL(req.url);
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const snapshotTable = assertSafeTableName(DEFAULT_SNAPSHOT_TABLE, 'AWIN_FEED_SYNC_TABLE');
  const targetTable = assertSafeTableName(DEFAULT_TARGET_TABLE, 'AWIN_LOOKFANTASTIC_TABLE');
  const envLimit = process.env.AWIN_SYNC_LIMIT?.trim() || null;
  const rowLimit = parseOptionalLimit(url.searchParams.get('limit'), parseOptionalLimit(envLimit, null));

  const sql = createSqlClient();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    await ensureTargetTable(sql, targetTable);

    const snapshot = await getLatestSnapshot(sql, snapshotTable);
    if (!snapshot) {
      throw new Error(`No saved snapshots found in ${snapshotTable} for source=${LOOKFANTASTIC_SOURCE}`);
    }

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(snapshot.bucket)
      .download(snapshot.storage_path);

    if (downloadError || !fileBlob) {
      throw new Error(downloadError?.message || 'Unable to download latest AWIN snapshot from storage');
    }

    const rawBuffer = Buffer.from(await fileBlob.arrayBuffer());
    const csvBuffer = maybeGunzip(rawBuffer, snapshot.storage_path);
    const csvText = csvBuffer.toString('utf8');

    const parsed = parseCsv(csvText, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      relax_column_count: true,
      trim: true,
    }) as T_RawRow[];

    const parsedRows = rowLimit ? parsed.slice(0, rowLimit) : parsed;
    const products: T_ProductRow[] = [];
    let skipped = 0;

    for (const row of parsedRows) {
      try {
        products.push(toProductRow(row, snapshot.id));
      } catch {
        skipped += 1;
      }
    }

    const totalUpserted = await upsertRows(sql, targetTable, products);

    const res = makeRes({
      tenant,
      severity: 'success',
      message: 'Synced latest Lookfantastic snapshot into awin_looksfantastic',
      data: {
        snapshot: {
          id: snapshot.id,
          bucket: snapshot.bucket,
          storage_path: snapshot.storage_path,
          created_at: snapshot.created_at,
        },
        table: targetTable,
        csvRows: parsedRows.length,
        upserted: totalUpserted,
        skipped,
        rowLimit,
      },
    });

    return NextResponse.json(res);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function GET(req: Request) {
  try {
    return await runIngest(req);
  } catch (error) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: error instanceof Error ? error.message : 'Unknown AWIN ingest error',
    });
    return NextResponse.json(res, { status: 500 });
  }
}

export const POST = GET;
