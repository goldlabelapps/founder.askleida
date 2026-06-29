# Overview

The Leida Founder Dashboard is a client-side admin experience mounted inside the NX Admin shell. It is focused on:

- Practitioner management
- Product ingestion and curation workflows
- AWIN affiliate product operations (search, queue, ingest, skip)

## Module Location

- Main module: `app/Leida/`
- Public module exports: `app/Leida/index.tsx`
- Router: `app/Leida/PageRouter.tsx`
- Dashboard shell page: `app/Leida/components/FounderDash/FounderDash.tsx`

## Key UX Areas

1. **Dashboard** (`/`) — high-level entry cards for practitioners and products.
2. **Practitioners** (`/practitioners`) — list/create/update practitioner records.
3. **Products** (`/products`) — AWIN feed operations and table-level maintenance actions.
4. **AWIN** (`/products/awin`) — searchable AWIN product grid with queue/skip actions.
5. **Queue** (`/products/queue`) — pending product decisions and processing.
6. **List** (`/products/list`) — product listing view.

## Runtime Model

- UI is implemented as client components (`'use client'`).
- State is stored under the global Redux tree (`state.redux.*`) via Uberedux.
- Leida dispatches async actions (thunk-style) for API calls and state transitions.
