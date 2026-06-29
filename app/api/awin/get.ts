import { NextResponse } from 'next/server';
import { makeRes } from '..';
import postgres from 'postgres';

const tenant = process.env.NEXT_PUBLIC_TENANT;
const LOOKFANTASTIC_TABLE =
  process.env.AWIN_PRODUCTS_TABLE?.trim()
  || process.env.AWIN_LOOKFANTASTIC_TABLE?.trim()
  || 'products_awin';
const TABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
type T_OrderByKey = 'id' | 'created_at' | 'product_name' | 'category_name' | 'search_price' | 'brand';

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
    throw new Error('Invalid AWIN_PRODUCTS_TABLE value');
  }
  return tableName;
}

function parseIntParam(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), min), max);
}

function parseOrderBy(value: string | null): T_OrderByKey {
  const input = (value || '').trim().toLowerCase();
  if (input === 'id') return 'id';
  if (input === 'product_name') return 'product_name';
  if (input === 'category_name') return 'category_name';
  if (input === 'search_price') return 'search_price';
  if (input === 'brand') return 'brand';
  return 'created_at';
}

function parseOrderDir(value: string | null) {
  return (value || '').trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
}

function parseBooleanParam(value: string | null, fallback: boolean) {
  const input = (value || '').trim().toLowerCase();
  if (!input) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(input)) return true;
  if (['0', 'false', 'no', 'off'].includes(input)) return false;
  return fallback;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = (url.searchParams.get('q') || '').trim();
  const category = (url.searchParams.get('category') || '').trim().toLowerCase();
  const brand = (url.searchParams.get('brand') || '').trim().toLowerCase();
  const includeQueued = parseBooleanParam(url.searchParams.get('includeQueued'), false);
  const limit = parseIntParam(url.searchParams.get('limit'), 25, 1, 100);
  const offset = parseIntParam(url.searchParams.get('offset'), 0, 0, 20000);
  const orderBy = parseOrderBy(url.searchParams.get('orderBy'));
  const orderDir = parseOrderDir(url.searchParams.get('orderDir'));
  const safeTable = assertSafeTableName(LOOKFANTASTIC_TABLE);

  const sql = createSqlClient();

  try {
    const normalizedQuery = query.toLowerCase();
    const like = `%${normalizedQuery}%`;
    const productNameExpr = sql`coalesce(data->>'product_name', data->>'name', data->>'title', '')`;
    const descriptionExpr = sql`coalesce(data->>'description', '')`;
    const categoryExpr = sql`coalesce(data->>'category_name', data->>'category', '')`;
    const brandExpr = sql`coalesce(data->>'brand_name', '')`;
    const queueStatusExpr = sql`lower(coalesce(data->>'queue_status', ''))`;
    const awProductIdExpr = sql`coalesce(data->>'aw_product_id', '')`;
    const merchantProductIdExpr = sql`coalesce(data->>'merchant_product_id', '')`;
    const eanExpr = sql`coalesce(data->>'ean', '')`;
    const numericPriceExpr = sql`
      case
        when nullif(regexp_replace(coalesce(data->>'search_price', data->>'price', ''), '[^0-9.-]', '', 'g'), '') ~ '^-?[0-9]+(\\.[0-9]+)?$'
          then (nullif(regexp_replace(coalesce(data->>'search_price', data->>'price', ''), '[^0-9.-]', '', 'g'), ''))::numeric
        else null
      end
    `;

    const filter = normalizedQuery
      ? sql`(
          lower(${productNameExpr}) like ${like}
          or lower(${descriptionExpr}) like ${like}
          or lower(${categoryExpr}) like ${like}
          or lower(${merchantProductIdExpr}) like ${like}
          or lower(${awProductIdExpr}) like ${like}
          or lower(${eanExpr}) like ${like}
          or lower(${brandExpr}) like ${like}
        )`
      : sql`true`;

    const categoryFilter = category
      ? sql`lower(${categoryExpr}) = ${category}`
      : sql`true`;

    const brandFilter = brand
      ? sql`lower(${brandExpr}) = ${brand}`
      : sql`true`;

    const queueStatusFilter = includeQueued
      ? sql`true`
      : sql`${queueStatusExpr} not in ('queued', 'skipped')`;

    const whereClause = sql`${filter} and ${categoryFilter} and ${brandFilter} and ${queueStatusFilter}`;
    const direction = orderDir === 'asc' ? sql`asc` : sql`desc`;

    const rowsBase = sql`
      select
        products_awin_id as id,
        slug,
        ${productNameExpr} as product_name,
        nullif(${descriptionExpr}, '') as description,
        nullif(${categoryExpr}, '') as category_name,
        ${numericPriceExpr} as search_price,
        nullif(coalesce(data->>'currency', ''), '') as currency,
        nullif(${eanExpr}, '') as ean,
        nullif(${awProductIdExpr}, '') as aw_product_id,
        nullif(${merchantProductIdExpr}, '') as merchant_product_id,
        nullif(coalesce(data->>'aw_deep_link', data->>'deeplink', ''), '') as aw_deep_link,
        created as created_at,
        data
      from public.${sql(safeTable)}
      where ${whereClause}
    `;

    const rowsPromise = orderBy === 'brand'
      ? sql`
          ${rowsBase}
          order by lower(${brandExpr}) ${direction}, created ${direction}
          limit ${limit}
          offset ${offset}
        `
      : orderBy === 'id'
      ? sql`
          ${rowsBase}
          order by products_awin_id ${direction}
          limit ${limit}
          offset ${offset}
        `
      : orderBy === 'product_name'
      ? sql`
          ${rowsBase}
          order by lower(${productNameExpr}) ${direction}, created ${direction}
          limit ${limit}
          offset ${offset}
        `
      : orderBy === 'category_name'
      ? sql`
          ${rowsBase}
          order by lower(${categoryExpr}) ${direction}, created ${direction}
          limit ${limit}
          offset ${offset}
        `
      : orderBy === 'search_price'
      ? sql`
          ${rowsBase}
          order by ${numericPriceExpr} ${direction} nulls last, created ${direction}
          limit ${limit}
          offset ${offset}
        `
      : sql`
          ${rowsBase}
          order by created ${direction}
          limit ${limit}
          offset ${offset}
        `;

    const [rows, countRows] = await Promise.all([
      rowsPromise,
      sql<Array<{ count: number }>>`
        select count(*)::int as count
        from public.${sql(safeTable)}
        where ${whereClause}
      `,
    ]);

    const total = countRows[0]?.count || 0;

    const res = makeRes({
      tenant,
      severity: 'success',
      message: 'Fetched AWIN results',
      data: {
        table: safeTable,
        query,
        category,
        brand,
        includeQueued,
        limit,
        offset,
        orderBy,
        orderDir,
        count: total,
        rows,
      },
    });

    return NextResponse.json(res);
  } catch (error) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: error instanceof Error ? error.message : 'Unknown AWIN query error',
    });
    return NextResponse.json(res, { status: 500 });
  } finally {
    await sql.end({ timeout: 5 });
  }
}