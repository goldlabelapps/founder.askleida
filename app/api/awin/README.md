# AWIN API Endpoint

This folder exposes server-side proxy routes for AWIN data under:

- `/api/awin`
- `/api/awin/programmes`
- `/api/awin/lookfantastic/products`
- `/api/awin/lookfantastic/feed`
- `/api/awin/lookfantastic/save`
- `/api/awin/lookfantastic/queue`
- `/api/awin/lookfantastic/sync`
- `/api/awin/lookfantastic/ingest`

The handlers use `app/api/awin/lib/client.ts` to call `https://api.awin.com` with your AWIN OAuth token.

## What This Endpoint Does

- Keeps AWIN credentials on the server (not in browser code).
- Normalizes responses into the project response envelope:
  - `time`
  - `app`
  - `severity`
  - `message`
  - `data`
- Supports lightweight filtering/limits before returning JSON.

## Environment Variables

Add these to your `.env.local`:

```bash
AWIN_OAUTH_TOKEN=your_oauth_token
AWIN_PUBLISHER_ID=your_publisher_id
AWIN_LOOKFANTASTIC_ADVERTISER_ID=your_default_lookfantastic_advertiser_id
# Optional, only needed when using source=feed or source=auto fallback:
AWIN_LOOKFANTASTIC_FEED_URL=https://example.awin.com/path/to/lookfantastic/feed.jsonl
# Optional sync storage/db settings:
AWIN_FEED_SYNC_BUCKET=awin-feeds
AWIN_FEED_SYNC_TABLE=awin_feed_snapshots
AWIN_LOOKFANTASTIC_TABLE=awin_lookfantastic
AWIN_SYNC_LIMIT=optional_row_limit_for_ingest
NEXT_PUBLIC_TENANT=optional_tenant_name
```

Notes:

- `AWIN_OAUTH_TOKEN` is required for all AWIN requests.
- `AWIN_PUBLISHER_ID` is required for `/programmes` and `/lookfantastic/feed`.
- `AWIN_LOOKFANTASTIC_ADVERTISER_ID` is required for `/lookfantastic/feed` unless you pass `advertiserId` as a query parameter.
- `AWIN_LOOKFANTASTIC_FEED_URL` is optional and only used when the route is told to query feed download URLs.
- `AWIN_LOOKFANTASTIC_FEED_URL` is required for `/lookfantastic/sync`.
- `AWIN_FEED_SYNC_BUCKET` defaults to `awin-feeds`.
- `AWIN_FEED_SYNC_TABLE` defaults to `awin_feed_snapshots`.
- `AWIN_LOOKFANTASTIC_TABLE` defaults to `awin_lookfantastic`.
- `AWIN_SYNC_LIMIT` optionally caps ingested rows.

## 1) Search Route (Primary)

`GET /api/awin`

Purpose:

- Query the `AWIN_LOOKFANTASTIC_TABLE` (defaults to `awin_lookfantastic`).
- Return filtered, searched, and ordered results for UI consumption.

- Supported query params:

- `q` (optional): case-insensitive text search across product_name, description, category_name, merchant_product_id, aw_product_id, ean, and data.brand_name.
- `category` (optional): exact case-insensitive category filter.
- `brand` (optional): exact case-insensitive brand filter (`data.brand_name`).
- `limit` (optional): result page size, clamped `1..100`, default `25`.
- `offset` (optional): pagination offset, clamped `0..20000`, default `0`.
- `orderBy` (optional): one of `created_at`, `id`, `product_name`, `category_name`, `search_price`. Default `created_at`.
- `orderDir` (optional): `asc` or `desc`. Default `desc`.

- Response data shape:

- `table`, `query`, `category`, `brand`
- `limit`, `offset`, `orderBy`, `orderDir`
- `count` (total rows matching filter)
- `rows` (paged row set)

Example:

```bash
curl "http://localhost:3000/api/awin?q=vitamin%20c&category=skincare&limit=25&orderBy=created_at&orderDir=desc"
```

## 1b) Search Alias Route

`GET /api/awin/lookfantastic/search`

Purpose:

- Alias for the root search route.
- Uses the same query params and returns the same response as `GET /api/awin`.

## 2) Programmes Route

`GET /api/awin/programmes`

AWIN upstream:

- `GET /publishers/{publisherId}/programmes`

Supported query params:

- `relationship` (optional): forwarded to AWIN.
- `countryCode` (optional): forwarded to AWIN.
- `includeHidden` (optional): forwarded to AWIN.
- `search` (optional): local case-insensitive filter on programme `name`.
- `limit` (optional): max returned rows, clamped to `1..200`, default `25`.

Response data shape:

- `count`: number returned after `limit`.
- `total`: number after local `search` filter before slicing.
- `programmes`: filtered and sliced list.

Example:

```bash
curl "http://localhost:3000/api/awin/programmes?countryCode=GB&search=lookfantastic&limit=20"
```

## 3) Lookfantastic Products Route (Recommended)

`GET /api/awin/lookfantastic/products`

AWIN upstream:

- Product API endpoint variants are tried for your account, API-only.
- This endpoint always forces `source=api`.

Supported query params:

- `q` (optional): local case-insensitive search against product text fields.
- `advertiserId` (optional): overrides `AWIN_LOOKFANTASTIC_ADVERTISER_ID`.
- `locale` (optional): default `en_GB`.
- `vertical` (optional): accepted but not required by product API variants.
- `limit` (optional): number of matches returned. Default `25`, max `100`.

Example:

```bash
curl "http://localhost:3000/api/awin/lookfantastic/products?q=vitamin%20c&limit=15"
```

## 4) Lookfantastic Feed Route (Optional / Fallback)

`GET /api/awin/lookfantastic/feed`

AWIN upstream:

- Default (`source=api`): AWIN product endpoints are tried first (account-dependent variants).
- Optional (`source=auto`): product API first, then feed download fallback.
- Optional (`source=feed`): force feed download mode.

Supported query params:

- `q` (optional): local case-insensitive search against product text fields.
- `advertiserId` (optional): overrides `AWIN_LOOKFANTASTIC_ADVERTISER_ID`.
- `locale` (optional): default `en_GB`.
- `vertical` (optional): default `retail`.
- `source` (optional): `api` (default), `auto`, or `feed`.
- `limit` (optional): number of matches returned. Default `25`, max `100`.
- `scanLimit` (optional): max JSONL rows scanned. Default `1000`, max `10000`.

How filtering works:

- In `source=api`, product API rows are filtered and sliced to `limit`.
- In `source=auto` or `source=feed`, feed mode streams/parses JSONL line by line.
- Feed mode increments `scanned` only for valid JSON rows.
- Feed mode stops when either collected matches reach `limit` or scanned rows reach `scanLimit`.

Response data shape:

- `advertiserId`, `locale`, `vertical`, `query`
- `limit`, `scanLimit`, `scanned`
- `count`
- `products`
- `source`

Example:

```bash
curl "http://localhost:3000/api/awin/lookfantastic/feed?q=vitamin%20c&limit=15&scanLimit=2000"
```

Allow feed fallback only if API variants fail:

```bash
curl "http://localhost:3000/api/awin/lookfantastic/feed?q=vitamin%20c&source=auto"
```

Override advertiser id example:

```bash
curl "http://localhost:3000/api/awin/lookfantastic/feed?advertiserId=12345&locale=en_GB&vertical=retail"
```

## 5) Save Lookfantastic Product Route

`POST /api/awin/lookfantastic/save`

Purpose:

- Takes a selected product from the Lookfantastic AWIN feed.
- Normalizes key fields.
- Inserts a row into `public.products`.

Required body fields:

- `practitioner_id` (string, uuid)
- `awinProduct` (object) or `product` (object)

Optional override body fields:

- `product_id`, `title`, `name`, `category`, `sku`, `price`, `description`, `notes`, `data`

Normalization behavior:

- `name` is inferred from override values first, then AWIN payload fields.
- `title` defaults to `name`.
- `price` is validated as a number `>= 0` when provided.
- AWIN metadata is persisted into `data`, including source fields and full original product payload.

Example:

```bash
curl -X POST "http://localhost:3000/api/awin/lookfantastic/save" \
  -H "Content-Type: application/json" \
  -d '{
    "practitioner_id": "00000000-0000-0000-0000-000000000000",
    "awinProduct": {
      "id": "LF-123",
      "title": "Sample Product",
      "description": "Example from AWIN feed",
      "search_price": 24.99,
      "aw_deep_link": "https://www.lookfantastic.com/..."
    }
  }'
```

## 6) Lookfantastic Feed Sync Route

`GET /api/awin/lookfantastic/sync`

Purpose:

- Checks the Lookfantastic feed URL for changes.
- Uses conditional request headers (`If-None-Match`, `If-Modified-Since`) from the last saved snapshot.
- Computes SHA-256 hash of the downloaded CSV.
- Uploads new CSV files to Supabase Storage only when changed.
- Writes snapshot metadata to a DB table (`awin_feed_snapshots` by default).

Behavior:

- If feed returns `304`, response includes `changed: false`.
- If content hash matches latest saved hash, response includes `changed: false`.
- If changed, response includes `changed: true` and saved snapshot metadata.

Also available as:

- `POST /api/awin/lookfantastic/sync`

Example:

```bash
curl "http://localhost:3000/api/awin/lookfantastic/sync"
```

## 6b) Queue Product Decision Route

`POST /api/awin/lookfantastic/queue`

Purpose:

- Supports two decisions:
  - `queue` (add to processing queue by creating a row in `public.product_queue`)
  - `delete` (delete matching row(s) from `awin_lookfantastic` only; no queue row is created)

Required body fields:

- `practitioner_id` (string, uuid)
- `decision` (`queue` or `delete`)
- `awinProduct` (object)

Identifier preference for `delete` source-row matching:

- `id`
- `unique_key`
- `aw_product_id`
- `merchant_product_id`

Duplicate guard behavior:

- A pending entry is treated as idempotent for the same practitioner + source product + decision.
- If the same pending decision already exists, the route returns success with `existingPending: true` and the existing queue row.

Example:

```bash
curl -X POST "http://localhost:3000/api/awin/lookfantastic/queue" \
  -H "Content-Type: application/json" \
  -d '{
    "practitioner_id": "00000000-0000-0000-0000-000000000000",
    "decision": "queue",
    "awinProduct": {
      "id": "12345",
      "product_name": "Sample Product",
      "aw_product_id": "AW-123"
    }
  }'
```

## 7) Lookfantastic Feed Ingest Route

`GET /api/awin/lookfantastic/ingest`

Purpose:

- Loads the latest saved feed snapshot from Storage.
- Parses CSV and normalizes product rows.
- Upserts rows into `awin_lookfantastic` (or `AWIN_LOOKFANTASTIC_TABLE`).
- Uses a unique key derived in this priority order: `ean`, `product_GTIN`, `upc`, `isbn`, `mpn`, `merchant_product_id`, `aw_product_id`, then fallback hash signature.

Behavior:

- Creates target table/indexes if missing.
- Upserts by `unique_key`.
- Returns ingest summary (`csvRows`, `upserted`, `skipped`, `snapshot`).

Optional query params:

- `limit`: limits number of rows parsed/upserted for that request (useful for testing).

Also available as:

- `POST /api/awin/lookfantastic/ingest`

Examples:

```bash
curl "http://localhost:3000/api/awin/lookfantastic/ingest"
curl "http://localhost:3000/api/awin/lookfantastic/ingest?limit=2000"
```

## Error Handling

Common failures and returned status:

- Missing token: `500` with message `Missing AWIN_OAUTH_TOKEN`.
- Missing publisher id: `500` with message `Missing AWIN_PUBLISHER_ID`.
- Missing lookfantastic advertiser id (and no query override): `500`.
- AWIN upstream non-2xx: proxied status code from AWIN, plus parsed AWIN error body in `data`.

## Local Testing Checklist

1. Set the required env vars.
2. Start the app.
3. Hit `/api/awin` first to confirm readiness.
4. Call `/api/awin/programmes`.
5. Call `/api/awin/lookfantastic/products` first for normal product search.
6. Use `/api/awin/lookfantastic/feed?source=auto` only when you want feed fallback behavior.
7. Trigger `/api/awin/lookfantastic/sync` from your cron job to persist updated CSV snapshots.
8. Trigger `/api/awin/lookfantastic/ingest` to upsert latest snapshot rows into `awin_lookfantastic`.

## Security Notes

- Keep `AWIN_OAUTH_TOKEN` server-only.
- Do not expose AWIN credentials in client-side code.
- These handlers already call AWIN from the server and return filtered JSON results.
