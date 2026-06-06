import { NextResponse } from 'next/server';
import { makeRes } from '../../../';
import { awinFetch, getAwinConfig, parseAwinErrorBody } from '../../lib/client';

const tenant = process.env.NEXT_PUBLIC_TENANT;

function toPositiveInt(input: string | null, fallback: number, max: number) {
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(n), max);
}

function productMatches(product: any, needle: string) {
  if (!needle) {
    return true;
  }

  const fromBasic = product?.product_basic || {};
  const haystack = [
    product?.title,
    product?.description,
    product?.brand,
    product?.id,
    fromBasic?.title,
    fromBasic?.description,
    fromBasic?.brand,
    fromBasic?.id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
}

function parseJsonLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

async function collectProductsFromJsonl(
  response: Response,
  options: { limit: number; scanLimit: number; query: string }
) {
  const reader = response.body?.getReader();

  if (!reader) {
    const text = await response.text();
    const lines = text.split('\n');
    const products: any[] = [];
    let scanned = 0;

    for (const line of lines) {
      if (scanned >= options.scanLimit || products.length >= options.limit) {
        break;
      }

      const item = parseJsonLine(line);
      if (!item) {
        continue;
      }

      scanned += 1;
      if (productMatches(item, options.query)) {
        products.push(item);
      }
    }

    return { products, scanned };
  }

  const decoder = new TextDecoder();
  const products: any[] = [];
  let scanned = 0;
  let buffer = '';

  while (scanned < options.scanLimit && products.length < options.limit) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (scanned >= options.scanLimit || products.length >= options.limit) {
        break;
      }

      const item = parseJsonLine(line);
      if (!item) {
        continue;
      }

      scanned += 1;
      if (productMatches(item, options.query)) {
        products.push(item);
      }
    }
  }

  if (buffer && scanned < options.scanLimit && products.length < options.limit) {
    const item = parseJsonLine(buffer);
    if (item) {
      scanned += 1;
      if (productMatches(item, options.query)) {
        products.push(item);
      }
    }
  }

  try {
    await reader.cancel();
  } catch {
    // no-op
  }

  return { products, scanned };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();
  const locale = url.searchParams.get('locale') || 'en_GB';
  const vertical = url.searchParams.get('vertical') || 'retail';
  const limit = toPositiveInt(url.searchParams.get('limit'), 25, 100);
  const scanLimit = toPositiveInt(url.searchParams.get('scanLimit'), 1000, 10000);

  const config = getAwinConfig();
  const publisherId = config.publisherId;
  const advertiserId =
    url.searchParams.get('advertiserId') || config.lookfantasticAdvertiserId;

  if (!publisherId) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Missing AWIN_PUBLISHER_ID',
    });
    return NextResponse.json(res, { status: 500 });
  }

  if (!advertiserId) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Missing AWIN_LOOKFANTASTIC_ADVERTISER_ID (or pass advertiserId query param)',
    });
    return NextResponse.json(res, { status: 500 });
  }

  try {
    const response = await awinFetch({
      path: `/publishers/${publisherId}/awinfeeds/download/${advertiserId}-${vertical}-${locale}.jsonl`,
      includeAccessTokenQuery: false,
    });

    if (!response.ok) {
      const err = await parseAwinErrorBody(response);
      const res = makeRes({
        tenant,
        severity: 'error',
        message: `AWIN feed request failed (${response.status})`,
        data: err,
      });
      return NextResponse.json(res, { status: response.status });
    }

    const { products, scanned } = await collectProductsFromJsonl(response, {
      limit,
      scanLimit,
      query,
    });

    const res = makeRes({
      tenant,
      severity: 'success',
      message: 'Fetched Lookfantastic feed products',
      data: {
        advertiserId,
        locale,
        vertical,
        query,
        limit,
        scanLimit,
        scanned,
        count: products.length,
        products,
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