import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { makeRes } from '../../../';

const tenant = process.env.NEXT_PUBLIC_TENANT;
const LOOKFANTASTIC_TABLE =
  process.env.AWIN_PRODUCTS_TABLE?.trim()
  || process.env.AWIN_LOOKFANTASTIC_TABLE?.trim()
  || 'products_awin';
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
    throw new Error('Invalid AWIN_PRODUCTS_TABLE value');
  }
  return tableName;
}

type T_BrandRow = {
  brand_name: string | null;
  count: number;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 100), 1), 200);
  const category = (url.searchParams.get('category') || '').trim().toLowerCase();
  const safeTable = assertSafeTableName(LOOKFANTASTIC_TABLE);
  const sql = createSqlClient();

  try {
    const categoryFilter = category
      ? sql`lower(coalesce(data->>'category_name', data->>'category', '')) = ${category}`
      : sql`true`;

    const brands = await sql<T_BrandRow[]>`
      select
        min(trim(data->>'brand_name')) as brand_name,
        count(*)::int as count
      from public.${sql(safeTable)}
      where coalesce(trim(data->>'brand_name'), '') <> ''
        and ${categoryFilter}
      group by lower(trim(data->>'brand_name'))
      order by count(*) desc, min(trim(data->>'brand_name')) asc
      limit ${limit}
    `;

    const res = makeRes({
      tenant,
      severity: 'success',
      message: 'Fetched AWIN Lookfantastic brands',
      data: {
        table: safeTable,
        category,
        count: brands.length,
        brands,
      },
    });

    return NextResponse.json(res);
  } catch (error) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: error instanceof Error ? error.message : 'Unknown AWIN brands error',
    });
    return NextResponse.json(res, { status: 500 });
  } finally {
    await sql.end({ timeout: 5 });
  }
}
