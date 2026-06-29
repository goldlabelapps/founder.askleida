# Navigation and Pages

Leida navigation is defined in `app/Leida/components/DashNav/navItems.ts` and rendered by `DashNav`.

## Primary Navigation

| Label | Route | Purpose |
|---|---|---|
| Dashboard | `/` | Founder landing page |
| Practitioners | `/practitioners` | Manage practitioner entities |
| Products | `/products` | Product ingestion and maintenance actions |
| Products → AWIN | `/products/awin` | AWIN search, select, queue/skip |
| Products → Queue | `/products/queue` | Work queue review and processing |
| Products → List | `/products/list` | Product list browsing |

## Dynamic Navigation Behavior

- Queue and product counts are fetched asynchronously in `DashNav`.
- Queue badge appears when pending queue items exist.
- Queue and product counts refresh on:
  - A 15-second interval
  - `leida:queue-count-refresh` and `leida:products-count-refresh` window events

## Route Resolution Notes

`PageRouter.tsx` includes tolerant practitioner path matching for legacy misspellings:

- `practitioners`
- `pracitioners`
- `paractitioners`

This keeps old/deviating links functional while routing to the same practitioner surface.
