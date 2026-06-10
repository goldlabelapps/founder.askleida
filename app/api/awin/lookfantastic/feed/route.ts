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

function toArrayPayload(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.products)) return obj.products as any[];
  if (Array.isArray(obj.items)) return obj.items as any[];
  if (Array.isArray(obj.data)) return obj.data as any[];

  return [];
}

async function tryFallbackSearchApi(options: {
  publisherId: string;
  advertiserId: string;
  query: string;
  locale: string;
  limit: number;
}) {
  const requestedLimit = Math.min(Math.max(options.limit, 1), 100);
  const candidates: Array<{
    label: string;
    path: string;
    query: Record<string, string | number | undefined>;
  }> = [
    {
      label: 'publishers-products-searchTerm',
      path: `/publishers/${options.publisherId}/products`,
      query: {
        advertiserId: options.advertiserId,
        searchTerm: options.query || undefined,
        language: options.locale,
        pageSize: requestedLimit,
      },
    },
    {
      label: 'publishers-products-query',
      path: `/publishers/${options.publisherId}/products`,
      query: {
        advertiserId: options.advertiserId,
        query: options.query || undefined,
        language: options.locale,
        pageSize: requestedLimit,
      },
    },
    {
      label: 'publishers-advertiser-products-searchTerm',
      path: `/publishers/${options.publisherId}/advertisers/${options.advertiserId}/products`,
      query: {
        searchTerm: options.query || undefined,
        language: options.locale,
        pageSize: requestedLimit,
      },
    },
    {
      label: 'publishers-advertiser-products-query',
      path: `/publishers/${options.publisherId}/advertisers/${options.advertiserId}/products`,
      query: {
        query: options.query || undefined,
        language: options.locale,
        pageSize: requestedLimit,
      },
    },
  ];

  const attempts: Array<Record<string, unknown>> = [];

  for (const candidate of candidates) {
    try {
      const response = await awinFetch({
        path: candidate.path,
        query: candidate.query,
      });

      if (!response.ok) {
        const upstreamError = await parseAwinErrorBody(response);
        attempts.push({
          label: candidate.label,
          path: candidate.path,
          status: response.status,
          upstream: upstreamError,
        });
        continue;
      }

      const payload = await response.json();
      const rows = toArrayPayload(payload);
      const filtered = options.query
        ? rows.filter((item) => productMatches(item, options.query))
        : rows;

      return {
        ok: true,
        source: candidate.label,
        products: filtered.slice(0, requestedLimit),
        scanned: rows.length,
        attempts,
      };
    } catch (error) {
      attempts.push({
        label: candidate.label,
        path: candidate.path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    ok: false,
    source: null,
    products: [] as any[],
    scanned: 0,
    attempts,
  };
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
    const feedUrl = process.env.AWIN_LOOKFANTASTIC_FEED_URL;
    const downloadPaths = [
      `/publishers/${publisherId}/awinfeeds/download/${advertiserId}-${vertical}-${locale}.jsonl`,
      `/publishers/${publisherId}/awinfeeds/download/${advertiserId}-${vertical}.jsonl`,
      `/publishers/${publisherId}/awinfeeds/download/${advertiserId}-${locale}.jsonl`,
      `/publishers/${publisherId}/awinfeeds/download/${advertiserId}.jsonl`,
      `/publishers/${publisherId}/awinfeeds/download/${advertiserId}-${vertical}-${locale}.json`,
      `/publishers/${publisherId}/awinfeeds/download/${advertiserId}-${vertical}.json`,
      `/publishers/${publisherId}/awinfeeds/download/${advertiserId}-${locale}.json`,
      `/publishers/${publisherId}/awinfeeds/download/${advertiserId}.json`,
    ];

    const attemptedFeedPaths: string[] = [];
    let attemptedPath = feedUrl || downloadPaths[0];
    let response: Response;

    if (feedUrl) {
      attemptedFeedPaths.push(feedUrl);
      response = await fetch(feedUrl, {
        headers: {
          Accept: '*/*',
          Authorization: `Bearer ${process.env.AWIN_OAUTH_TOKEN}`,
        },
        cache: 'no-store',
      });
    } else {
      let candidateResponse: Response | null = null;

      for (const path of downloadPaths) {
        attemptedFeedPaths.push(path);
        attemptedPath = path;
        const nextResponse = await awinFetch({
          path,
          includeAccessTokenQuery: false,
        });

        candidateResponse = nextResponse;
        if (nextResponse.ok) {
          break;
        }

        // If upstream returns non-404, stop trying variants and return that error.
        if (nextResponse.status !== 404) {
          break;
        }
      }

      if (!candidateResponse) {
        throw new Error('Unable to request AWIN feed');
      }

      response = candidateResponse;
    }

    if (!response.ok) {
      const err = await parseAwinErrorBody(response);
      const fallback = response.status === 404
        ? await tryFallbackSearchApi({
          publisherId,
          advertiserId,
          query,
          locale,
          limit,
        })
        : null;

      if (fallback?.ok) {
          const res = makeRes({
            tenant,
            severity: 'success',
            message: 'Fetched Lookfantastic products via fallback AWIN product API',
            data: {
              advertiserId,
              locale,
              vertical,
              query,
              limit,
              scanLimit,
              scanned: fallback.scanned,
              count: fallback.products.length,
              products: fallback.products,
              source: fallback.source,
            },
          });

          return NextResponse.json(res);
      }

      const hint = response.status === 404
        ? 'AWIN returned 404 for this feed path. Verify advertiserId/locale/vertical, set AWIN_LOOKFANTASTIC_FEED_URL to the exact feed URL from AWIN, or use the fallback attempts in response data to identify a working product API path for your account.'
        : null;
      const res = makeRes({
        tenant,
        severity: 'error',
        message: `AWIN feed request failed (${response.status})`,
        data: {
          advertiserId,
          locale,
          vertical,
          usedFeedUrlOverride: Boolean(feedUrl),
          attemptedPath,
          attemptedFeedPaths,
          hint,
          upstream: err,
          fallbackAttempts: fallback?.attempts || [],
        },
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