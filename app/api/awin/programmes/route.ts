import { NextResponse } from 'next/server';
import { makeRes } from '../../';
import { awinFetch, getAwinConfig, parseAwinErrorBody } from '../lib/client';

const tenant = process.env.NEXT_PUBLIC_TENANT;

type T_Programme = {
  id?: number;
  name?: string;
  [key: string]: unknown;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const relationship = url.searchParams.get('relationship') || undefined;
  const countryCode = url.searchParams.get('countryCode') || undefined;
  const includeHidden = url.searchParams.get('includeHidden') || undefined;
  const search = (url.searchParams.get('search') || '').trim().toLowerCase();
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 25), 1), 200);

  const { publisherId } = getAwinConfig();

  if (!publisherId) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Missing AWIN_PUBLISHER_ID',
    });
    return NextResponse.json(res, { status: 500 });
  }

  try {
    const response = await awinFetch({
      path: `/publishers/${publisherId}/programmes`,
      query: {
        relationship,
        countryCode,
        includeHidden,
      },
    });

    if (!response.ok) {
      const err = await parseAwinErrorBody(response);
      const res = makeRes({
        tenant,
        severity: 'error',
        message: `AWIN request failed (${response.status})`,
        data: err,
      });
      return NextResponse.json(res, { status: response.status });
    }

    const payload = (await response.json()) as T_Programme[] | Record<string, unknown>;
    const rows = Array.isArray(payload) ? payload : [];

    const filtered = search
      ? rows.filter((item) => String(item?.name || '').toLowerCase().includes(search))
      : rows;

    const res = makeRes({
      tenant,
      severity: 'success',
      message: 'Fetched programmes',
      data: {
        count: Math.min(filtered.length, limit),
        total: filtered.length,
        programmes: filtered.slice(0, limit),
      },
    });

    return NextResponse.json(res);
  } catch (error) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: error instanceof Error ? error.message : 'Unknown AWIN error',
    });
    return NextResponse.json(res, { status: 500 });
  }
}