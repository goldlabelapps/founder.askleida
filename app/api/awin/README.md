# AWIN API Endpoint

This folder exposes server-side proxy routes for AWIN data under:

- `/api/awin`
- `/api/awin/programmes`
- `/api/awin/lookfantastic/products`
- `/api/awin/lookfantastic/feed`
- `/api/awin/lookfantastic/save`

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
NEXT_PUBLIC_TENANT=optional_tenant_name
```

Notes:

- `AWIN_OAUTH_TOKEN` is required for all AWIN requests.
- `AWIN_PUBLISHER_ID` is required for `/programmes` and `/lookfantastic/feed`.
- `AWIN_LOOKFANTASTIC_ADVERTISER_ID` is required for `/lookfantastic/feed` unless you pass `advertiserId` as a query parameter.
- `AWIN_LOOKFANTASTIC_FEED_URL` is optional and only used when the route is told to query feed download URLs.

## 1) Status/Discovery Route

`GET /api/awin`

Purpose:

- Quick health/status check.
- Returns whether required AWIN env vars are present.
- Returns discovered child routes.

Success status:

- `200` when token and publisher id are present.

Warning status:

- `500` when one or both required env vars are missing.

Example:

```bash
curl "http://localhost:3000/api/awin"
```

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

## Security Notes

- Keep `AWIN_OAUTH_TOKEN` server-only.
- Do not expose AWIN credentials in client-side code.
- These handlers already call AWIN from the server and return filtered JSON results.
