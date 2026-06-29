# Operations Runbook

## Daily Founder Operations

1. Open `/products` and run **AWIN Cron** to check whether feed updates are available.
2. If updates are available, run **Ingest AWIN Feed**.
3. Review `/products/awin` and queue/skip products in bulk.
4. Process pending items from `/products/queue`.
5. Review `/products/list` and `/practitioners` for final validation.

## Safety-Critical Actions in Products Page

The products surface contains destructive maintenance actions:

- **Drop AWIN Table** (clears AWIN records)
- **Drop Queue Table** (clears queue records)

These actions are guarded by confirmation dialogs but should still be treated as administrative-only operations.

## Operational Signals

- Navigation badges reflect queue and product totals.
- Dashboard/UI feedback is surfaced through DesignSystem feedback toasts and warning/success messages.
- AWIN update checks return explicit changed/not-changed status summaries.

## Common Failure Modes

- Missing AWIN environment variables
- Upstream AWIN auth/token issues
- Ingest attempted before sync/configuration is in place
- Practitioner context missing when queueing decisions

When debugging endpoint-specific failures, use:

- [`docs/source-readmes/app/api/awin/README.md`](../source-readmes/app/api/awin/README.md)
- [`docs/source-readmes/app/api/practitioners/README.md`](../source-readmes/app/api/practitioners/README.md)
