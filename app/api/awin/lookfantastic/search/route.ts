import { NextResponse } from 'next/server';
import { makeRes } from '../../../';
import postgres, { type Sql } from 'postgres';

const tenant = process.env.NEXT_PUBLIC_TENANT;
const LOOKFANTASTIC_TABLE = process.env.AWIN_LOOKFANTASTIC_TABLE?.trim() || 'awin_lookfantastic';
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
    throw new Error('Invalid AWIN_LOOKFANTASTIC_TABLE value');
  }
  return tableName;
}

function parseIntParam(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), min), max);
}

type T_SearchRow = {
  id: number;
  unique_key: string;
  product_name: string | null;
  description: string | null;
  category_name: string | null;
  search_price: number | null;
  currency: string | null;
  aw_product_id: string | null;
  merchant_product_id: string | null;
  aw_deep_link: string | null;
  created_at: string;
  data: Record<string, unknown> | null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = (url.searchParams.get('q') || '').trim();
  const category = (url.searchParams.get('category') || '').trim().toLowerCase();
  const limit = parseIntParam(url.searchParams.get('limit'), 25, 1, 100);
  const offset = parseIntParam(url.searchParams.get('offset'), 0, 0, 20000);
  const safeTable = assertSafeTableName(LOOKFANTASTIC_TABLE);

  const sql = createSqlClient();

  try {
    const normalizedQuery = query.toLowerCase();
    const like = `%${normalizedQuery}%`;

    const filter = normalizedQuery
      ? sql`(
          lower(coalesce(product_name, '')) like ${like}
          or lower(coalesce(description, '')) like ${like}
          or lower(coalesce(category_name, '')) like ${like}
          or lower(coalesce(merchant_product_id, '')) like ${like}
          or lower(coalesce(aw_product_id, '')) like ${like}
          or lower(coalesce(ean, '')) like ${like}
          or lower(coalesce(data->>'brand_name', '')) like ${like}
        )`
      : sql`true`;

    const categoryFilter = category
      ? sql`lower(coalesce(category_name, '')) = ${category}`
      : sql`true`;

    const whereClause = sql`${filter} and ${categoryFilter}`;

    const [rows, countRows] = await Promise.all([
      sql<T_SearchRow[]>`
        select
          id,
          unique_key,
          product_name,
          description,
          category_name,
          search_price,
          currency,
          aw_product_id,
          merchant_product_id,
          aw_deep_link,
          created_at,
          data
        from public.${sql(safeTable)}
        where ${whereClause}
        order by id desc
        limit ${limit}
        offset ${offset}
      `,
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
      message: 'Fetched AWIN Lookfantastic search results',
      data: {
        table: safeTable,
        query,
        category,
        limit,
        offset,
        count: total,
        rows,
      },
    });

    return NextResponse.json(res);
  } catch (error) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: error instanceof Error ? error.message : 'Unknown AWIN search error',
    });
    return NextResponse.json(res, { status: 500 });
  } finally {
    await sql.end({ timeout: 5 });
  }
}
