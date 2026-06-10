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

  const queue: unknown[] = [product];
  const seen = new Set<unknown>();
  const words: string[] = [];
  let inspectedObjects = 0;

  while (queue.length && inspectedObjects < 200) {
    const value = queue.shift();
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      words.push(value);
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      words.push(String(value));
      continue;
    }

    if (typeof value !== 'object' || seen.has(value)) {
      continue;
    }

    seen.add(value);
    inspectedObjects += 1;

    if (Array.isArray(value)) {
      for (const item of value) {
        queue.push(item);
      }
      continue;
    }

    for (const nested of Object.values(value as Record<string, unknown>)) {
      queue.push(nested);
    }
  }

  const haystack = words.join(' ').toLowerCase();

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
  if (Array.isArray(obj.result)) return obj.result as any[];
  if (Array.isArray(obj.results)) return obj.results as any[];

  const dataObj = obj.data && typeof obj.data === 'object'
    ? (obj.data as Record<string, unknown>)
    : null;
  if (dataObj) {
    if (Array.isArray(dataObj.products)) return dataObj.products as any[];
    if (Array.isArray(dataObj.items)) return dataObj.items as any[];
    if (Array.isArray(dataObj.results)) return dataObj.results as any[];
    if (Array.isArray(dataObj.result)) return dataObj.result as any[];
  }

  // Some AWIN responses can be keyed objects rather than explicit arrays.
  const values = Object.values(obj);
  if (values.length > 0 && values.every((value) => value && typeof value === 'object')) {
    return values as any[];
  }

  return [];
}

async function tryProductSearchApi(options: {
  publisherId: string;
  advertiserId: string;
  query: string;
  locale: string;
  limit: number;
}) {
  const requestedLimit = Math.min(Math.max(options.limit, 1), 100);
  const countryCode = options.locale.includes('_')
    ? options.locale.split('_')[1]
    : options.locale;

  const pathCandidates = [
    `/publishers/${options.publisherId}/products`,
    `/publishers/${options.publisherId}/product-search`,
    `/publishers/${options.publisherId}/advertisers/${options.advertiserId}/products`,
    `/publishers/${options.publisherId}/programmes/${options.advertiserId}/products`,
  ];

  const advertiserVariants: Array<Record<string, string | number | undefined>> = [
    { advertiserId: options.advertiserId },
    { advertiserIds: options.advertiserId },
    { advertiser: options.advertiserId },
    { merchantId: options.advertiserId },
  ];

  const searchVariants: Array<Record<string, string | number | undefined>> = options.query
    ? [
      { searchTerm: options.query },
      { query: options.query },
      { search: options.query },
      { keyword: options.query },
      { keywords: options.query },
      { term: options.query },
    ]
    : [{}];

  const localeVariants: Array<Record<string, string | number | undefined>> = [
    { language: options.locale },
    { locale: options.locale },
    { countryCode },
  ];

  const pagingVariants: Array<Record<string, string | number | undefined>> = [
    { pageSize: requestedLimit, page: 1 },
    { limit: requestedLimit, page: 1 },
    { perPage: requestedLimit, page: 1 },
  ];

  const candidates: Array<{
    label: string;
    path: string;
    query: Record<string, string | number | undefined>;
  }> = [
  ];

  for (const path of pathCandidates) {
    const usesAdvertiserInPath = path.includes(`/advertisers/${options.advertiserId}/`) || path.includes(`/programmes/${options.advertiserId}/`);
    const advertiserSet = usesAdvertiserInPath ? ([{}] as Array<Record<string, string | number | undefined>>) : advertiserVariants;

    for (const advertiserQuery of advertiserSet) {
      for (const searchQuery of searchVariants) {
        for (const localeQuery of localeVariants) {
          for (const pagingQuery of pagingVariants) {
            const variantQuery = {
              ...advertiserQuery,
              ...searchQuery,
              ...localeQuery,
              ...pagingQuery,
            };

            const activeKeys = Object.keys(variantQuery).filter((key) => variantQuery[key] !== undefined);
            candidates.push({
              label: `${path.replace(/\//g, '_')}:${activeKeys.join(',')}`,
              path,
              query: variantQuery,
            });
          }
        }
      }
    }
  }

  // Deduplicate generated permutations while keeping order.
  const dedupedCandidates: typeof candidates = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const key = `${candidate.path}?${JSON.stringify(candidate.query)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    dedupedCandidates.push(candidate);
  }

  const maxCandidates = 60;
  const finalCandidates = dedupedCandidates.slice(0, maxCandidates);

  const attempts: Array<Record<string, unknown>> = [];

  for (const candidate of finalCandidates) {
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
          query: candidate.query,
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
        query: candidate.query,
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
  const source = (url.searchParams.get('source') || 'api').toLowerCase();
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

  if (!['api', 'feed', 'auto'].includes(source)) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Invalid source. Use source=api, source=feed, or source=auto.',
    });
    return NextResponse.json(res, { status: 400 });
  }

  try {
    if (source !== 'feed') {
      const apiResult = await tryProductSearchApi({
        publisherId,
        advertiserId,
        query,
        locale,
        limit,
      });

      if (apiResult.ok) {
        const res = makeRes({
          tenant,
          severity: 'success',
          message: 'Fetched Lookfantastic products via AWIN product API',
          data: {
            advertiserId,
            locale,
            vertical,
            query,
            limit,
            scanLimit,
            scanned: apiResult.scanned,
            count: apiResult.products.length,
            products: apiResult.products,
            source: apiResult.source,
          },
        });

        return NextResponse.json(res);
      }

      if (source === 'api') {
        const statusFromAttempts = apiResult.attempts.find(
          (attempt) => typeof attempt.status === 'number'
        )?.status as number | undefined;
        const all403 = apiResult.attempts.length > 0
          && apiResult.attempts.every((attempt) => attempt?.status === 403);
        const message = all403
          ? 'AWIN denied product API access (403) for this publisher/token'
          : 'AWIN product API request failed for all known endpoints';
        const hint = all403
          ? 'AWIN returned edge-level Access Denied for all attempts. Confirm this token has Product API permission for this publisher, and verify access in AWIN dashboard/support. You can temporarily use source=auto for feed fallback.'
          : 'Use source=auto to allow datafeed fallback, inspect apiAttempts for the first non-404/401 attempt, try again without q to confirm baseline product access, and verify this advertiser exists in /api/awin/programmes for your publisher account.';
        const res = makeRes({
          tenant,
          severity: 'error',
          message,
          data: {
            advertiserId,
            locale,
            query,
            hint,
            apiAttempts: apiResult.attempts,
          },
        });
        return NextResponse.json(res, { status: statusFromAttempts || 502 });
      }
    }

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
      const hint = response.status === 404
        ? 'AWIN returned 404 for this feed path. Verify advertiserId/locale/vertical and use source=api (recommended) or source=auto. If you need feeds, set AWIN_LOOKFANTASTIC_FEED_URL to the exact AWIN feed URL.'
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
        source: feedUrl ? 'feed-url-override' : 'feed-download',
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