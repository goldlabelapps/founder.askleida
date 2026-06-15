import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import postgres, { type Sql } from 'postgres';
import { makeRes } from '../../../';

const tenant = process.env.NEXT_PUBLIC_TENANT;
const LOOKFANTASTIC_SOURCE = 'lookfantastic';
const DEFAULT_FEED_TABLE = 'awin_feed_snapshots';
const DEFAULT_BUCKET = 'awin-feeds';

function createSqlClient() {
  const databaseUrl =
    process.env.DATABASE_URL
    || process.env.POSTGRES_URL
    || process.env.SUPABASE_DB_URL;

  if (!databaseUrl?.trim()) {
    throw new Error('Missing database connection string. Set DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL.');
  }

  return postgres(databaseUrl.trim(), { prepare: false });
}

type T_SnapshotRow = {
  id: number;
  source: string;
  feed_url: string;
  bucket: string;
  storage_path: string;
  content_hash: string;
  etag: string | null;
  last_modified: string | null;
  content_length: number | null;
  status: string;
  created_at: string;
};

function asHeaderOrNull(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBucket(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_BUCKET;
}

function normalizeTable(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_FEED_TABLE;
}

function toIntOrNull(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : null;
}

async function ensureSnapshotTable(sql: Sql, tableName: string) {
  await sql.unsafe(`
    create table if not exists public.${tableName} (
      id bigserial primary key,
      source text not null,
      feed_url text not null,
      bucket text not null,
      storage_path text not null,
      content_hash text not null,
      etag text,
      last_modified text,
      content_length bigint,
      status text not null default 'saved',
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
    create index if not exists ${tableName}_source_created_at_idx
      on public.${tableName} (source, created_at desc);
  `);
}

async function getLatestSnapshot(
  sql: Sql,
  tableName: string,
  source: string,
  feedUrl: string
) {
  const rows = await sql<T_SnapshotRow[]>`
    select
      id,
      source,
      feed_url,
      bucket,
      storage_path,
      content_hash,
      etag,
      last_modified,
      content_length,
      status,
      created_at
    from public.${sql(tableName)}
    where source = ${source}
      and feed_url = ${feedUrl}
      and status = 'saved'
    order by created_at desc
    limit 1
  `;

  return rows[0] || null;
}

function buildStoragePath(hash: string) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const shortHash = hash.slice(0, 12);

  return `${LOOKFANTASTIC_SOURCE}/${year}/${month}/${day}/feed-${timestamp}-${shortHash}.csv`;
}

export async function GET() {
  const feedUrl = process.env.AWIN_LOOKFANTASTIC_FEED_URL?.trim();
  const tableName = normalizeTable(process.env.AWIN_FEED_SYNC_TABLE);
  const bucket = normalizeBucket(process.env.AWIN_FEED_SYNC_BUCKET);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!feedUrl) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Missing AWIN_LOOKFANTASTIC_FEED_URL',
    });
    return NextResponse.json(res, { status: 500 });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    });
    return NextResponse.json(res, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const sql = createSqlClient();

  try {
    await ensureSnapshotTable(sql, tableName);

    const latest = await getLatestSnapshot(sql, tableName, LOOKFANTASTIC_SOURCE, feedUrl);

    const response = await fetch(feedUrl, {
      headers: {
        Accept: 'text/csv,*/*',
        ...(process.env.AWIN_OAUTH_TOKEN
          ? { Authorization: `Bearer ${process.env.AWIN_OAUTH_TOKEN}` }
          : {}),
        ...(latest?.etag ? { 'If-None-Match': latest.etag } : {}),
        ...(latest?.last_modified ? { 'If-Modified-Since': latest.last_modified } : {}),
      },
      cache: 'no-store',
    });

    if (response.status === 304 && latest) {
      const res = makeRes({
        tenant,
        severity: 'success',
        message: 'No change in Lookfantastic feed',
        data: {
          changed: false,
          reason: 'not_modified',
          latest,
        },
      });
      return NextResponse.json(res);
    }

    if (!response.ok) {
      const bodyText = await response.text();
      const res = makeRes({
        tenant,
        severity: 'error',
        message: `Feed request failed (${response.status})`,
        data: {
          feedUrl,
          upstream: bodyText,
        },
      });
      return NextResponse.json(res, { status: response.status });
    }

    const etag = asHeaderOrNull(response.headers.get('etag'));
    const lastModified = asHeaderOrNull(response.headers.get('last-modified'));
    const contentLength = toIntOrNull(response.headers.get('content-length'));
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentHash = createHash('sha256').update(buffer).digest('hex');

    if (latest && latest.content_hash === contentHash) {
      const res = makeRes({
        tenant,
        severity: 'success',
        message: 'No change in Lookfantastic feed',
        data: {
          changed: false,
          reason: 'hash_match',
          latest,
        },
      });
      return NextResponse.json(res);
    }

    const storagePath = buildStoragePath(contentHash);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: 'text/csv; charset=utf-8',
        upsert: false,
      });

    if (uploadError) {
      const res = makeRes({
        tenant,
        severity: 'error',
        message: uploadError.message,
      });
      return NextResponse.json(res, { status: 500 });
    }

    const insertedRows = await sql<T_SnapshotRow[]>`
      insert into public.${sql(tableName)} (
        source,
        feed_url,
        bucket,
        storage_path,
        content_hash,
        etag,
        last_modified,
        content_length,
        status,
        metadata
      )
      values (
        ${LOOKFANTASTIC_SOURCE},
        ${feedUrl},
        ${bucket},
        ${storagePath},
        ${contentHash},
        ${etag},
        ${lastModified},
        ${contentLength},
        ${'saved'},
        ${sql.json({
          endpoint: '/api/awin/lookfantastic/sync',
          previousSnapshotId: latest?.id || null,
          byteLength: buffer.byteLength,
        })}
      )
      returning
        id,
        source,
        feed_url,
        bucket,
        storage_path,
        content_hash,
        etag,
        last_modified,
        content_length,
        status,
        created_at
    `;

    const saved = insertedRows[0];
    const res = makeRes({
      tenant,
      severity: 'success',
      message: 'Saved latest Lookfantastic feed CSV',
      data: {
        changed: true,
        saved,
      },
    });

    return NextResponse.json(res);
  } catch (error) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: error instanceof Error ? error.message : 'Unknown AWIN sync error',
    });
    return NextResponse.json(res, { status: 500 });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export const POST = GET;