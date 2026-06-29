# Data and API Surface

## Core Backend Surfaces

The Founder Dashboard is API-driven. Core route families include:

- `GET /api/awin` (search and listing)
- `GET /api/awin/programmes`
- `GET /api/awin/lookfantastic/products`
- `GET /api/awin/lookfantastic/feed`
- `POST /api/awin/lookfantastic/save`
- `POST /api/awin/lookfantastic/queue`
- `GET|POST /api/awin/lookfantastic/sync`
- `GET|POST /api/awin/lookfantastic/ingest`
- Practitioner endpoints under `app/api/practitioners/*`

## AWIN Data Lifecycle (Operational)

1. **Sync** fetches/compares feed snapshots.
2. **Ingest** normalizes and upserts products into AWIN product storage.
3. **Browse/Search** uses `/api/awin`.
4. **Decisioning** queues or skips products through `/api/awin/lookfantastic/queue`.
5. **Queue Processing** transitions selected records into downstream product workflows.

## Key Data Stores Mentioned in Existing Module Docs

- `products_awin` (AWIN source product snapshots/search index)
- `product_queue` (decision queue records)
- `practitioners` (founder-managed practitioner identities + metadata)

## Environment Variables (AWIN)

The following are expected for AWIN integrations:

- `AWIN_OAUTH_TOKEN`
- `AWIN_PUBLISHER_ID`
- `AWIN_LOOKFANTASTIC_ADVERTISER_ID`
- `AWIN_LOOKFANTASTIC_FEED_URL` (required for sync/feed workflows)
- `AWIN_FEED_SYNC_BUCKET`
- `AWIN_FEED_SYNC_TABLE`
- `AWIN_PRODUCTS_TABLE`
- `AWIN_SYNC_LIMIT` (optional ingestion cap)

For the full endpoint-level details from the original module docs, see:

- [`docs/source-readmes/app/api/awin/README.md`](../source-readmes/app/api/awin/README.md)
