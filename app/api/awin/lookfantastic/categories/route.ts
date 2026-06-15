import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { makeRes } from '../../../';

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

type T_CategoryRow = {
  category_name: string | null;
  count: number;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 20), 1), 50);
  const safeTable = assertSafeTableName(LOOKFANTASTIC_TABLE);
  const sql = createSqlClient();

  try {
    const categories = await sql<T_CategoryRow[]>`
      select
        category_name,
        count(*)::int as count
      from public.${sql(safeTable)}
      where coalesce(trim(category_name), '') <> ''
      group by category_name
      order by count(*) desc, category_name asc
      limit ${limit}
    `;

    const res = makeRes({
      tenant,
      severity: 'success',
      message: 'Fetched AWIN Lookfantastic categories',
      data: {
        table: safeTable,
        count: categories.length,
        categories,
      },
    });

    return NextResponse.json(res);
  } catch (error) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: error instanceof Error ? error.message : 'Unknown AWIN categories error',
    });
    return NextResponse.json(res, { status: 500 });
  } finally {
    await sql.end({ timeout: 5 });
  }
}
