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
const DEFAULT_TARGET_TABLE =
  process.env.AWIN_PRODUCTS_TABLE?.trim()
  || process.env.AWIN_LOOKFANTASTIC_TABLE?.trim()
  || 'products_awin';
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
  slug: string;
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPopulatedObject(value: Record<string, unknown>) {
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === null || entry === undefined) {
      continue;
    }

    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (!trimmed.length) {
        continue;
      }
      output[key] = trimmed;
      continue;
    }

    if (Array.isArray(entry)) {
      if (entry.length) {
        output[key] = entry;
      }
      continue;
    }

    if (typeof entry === 'object') {
      const nested = toPopulatedObject(entry as Record<string, unknown>);
      if (Object.keys(nested).length) {
        output[key] = nested;
      }
      continue;
    }

    output[key] = entry;
  }

  return output;
}

function buildSlug(row: T_RawRow, fallbackKey: string) {
  const title = normalizeText(row.product_name)
    || normalizeText(row.title)
    || normalizeText(row.name)
    || normalizeText(row.aw_product_id)
    || normalizeText(row.merchant_product_id)
    || fallbackKey;

  const base = slugify(title || fallbackKey) || fallbackKey;
  const maxLength = 96;
  return base.slice(0, maxLength);
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
      products_awin_id uuid not null default gen_random_uuid(),
      slug text,
      created timestamptz null default now(),
      updated timestamptz null default now(),
      data jsonb null,
      constraint ${tableName}_pkey primary key (products_awin_id)
    );

    create unique index if not exists ${tableName}_slug_unique_idx
      on public.${tableName} (slug);

    create index if not exists ${tableName}_created_idx
      on public.${tableName} (created);
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

function toProductRow(row: T_RawRow, snapshotId: number, targetTable: string): T_ProductRow {
  const uniqueKey = pickUniqueValue(row);
  const data = toPopulatedObject({
    ...row,
    snapshot_id: snapshotId,
    source: LOOKFANTASTIC_SOURCE,
    source_table: targetTable,
  });

  return {
    slug: buildSlug(row, uniqueKey),
    data: {
      ...data,
      unique_key: uniqueKey,
    },
  };
}

async function upsertRows(sql: Sql, tableName: string, rows: T_ProductRow[]) {
  if (rows.length === 0) {
    return 0;
  }

  // Avoid Postgres ON CONFLICT double-hit errors when a single batch contains duplicate slugs.
  const dedupedRows = Array.from(
    rows.reduce((map, row) => map.set(row.slug, row), new Map<string, T_ProductRow>()).values(),
  );

  const chunkSize = 500;
  let processed = 0;

  for (let index = 0; index < dedupedRows.length; index += chunkSize) {
    const chunk = dedupedRows.slice(index, index + chunkSize);

    await sql`
      insert into public.${sql(tableName)} ${sql(chunk, [
        'slug',
        'data',
      ])}
      on conflict (slug)
      do update set
        data = excluded.data,
        updated = now()
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

function matchesCategoryFilter(row: T_RawRow, categoryFilter: string | null) {
  if (!categoryFilter) {
    return true;
  }

  const categoryName = normalizeText(row.category_name)?.toLowerCase() || '';
  const merchantCategory = normalizeText(row.merchant_category)?.toLowerCase() || '';
  const filter = categoryFilter.toLowerCase();

  return categoryName.includes(filter) || merchantCategory.includes(filter);
}

async function runIngest(req: Request) {
  const url = new URL(req.url);
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const snapshotTable = assertSafeTableName(DEFAULT_SNAPSHOT_TABLE, 'AWIN_FEED_SYNC_TABLE');
  const targetTable = assertSafeTableName(DEFAULT_TARGET_TABLE, 'AWIN_PRODUCTS_TABLE');
  const envLimit = process.env.AWIN_SYNC_LIMIT?.trim() || null;
  const rowLimit = parseOptionalLimit(url.searchParams.get('limit'), parseOptionalLimit(envLimit, null));
  const categoryFilter = normalizeText(url.searchParams.get('category'));

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

    const categoryFilteredRows = categoryFilter
      ? parsed.filter((row) => matchesCategoryFilter(row, categoryFilter))
      : parsed;
    const parsedRows = rowLimit ? categoryFilteredRows.slice(0, rowLimit) : categoryFilteredRows;
    const products: T_ProductRow[] = [];
    let skipped = 0;

    for (const row of parsedRows) {
      try {
        products.push(toProductRow(row, snapshot.id, targetTable));
      } catch {
        skipped += 1;
      }
    }

    const totalUpserted = await upsertRows(sql, targetTable, products);

    const res = makeRes({
      tenant,
      severity: 'success',
      message: `Synced latest Lookfantastic snapshot into ${targetTable}`,
      data: {
        snapshot: {
          id: snapshot.id,
          bucket: snapshot.bucket,
          storage_path: snapshot.storage_path,
          created_at: snapshot.created_at,
        },
        table: targetTable,
        csvRows: parsedRows.length,
        categoryFilter,
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
