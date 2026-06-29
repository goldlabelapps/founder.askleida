# Developer Guide

## Local Development Entry Points

- Leida module exports: `app/Leida/index.tsx`
- Founder dashboard page: `app/Leida/components/FounderDash/FounderDash.tsx`
- Router: `app/Leida/PageRouter.tsx`
- Navigation: `app/Leida/components/DashNav/*`
- Product/AWIN features: `app/Leida/components/Products/*`
- Practitioners features: `app/Leida/components/Practitioners/*`

## Recommended Workflow for Changes

1. Add/update feature logic in `components/*`, `actions/*`, and `hooks/*`.
2. Re-export public API from `app/Leida/index.tsx` if the feature is externally consumed.
3. Ensure route accessibility via `PageRouter.tsx` and `navItems.ts`.
4. Keep global header state aligned for each page (`setLeida('header', ...)`).

## Implementation Conventions Observed

- Client-only UI in Leida pages/hooks (`'use client'`).
- Thunk-style async actions returning structured success/error payloads where needed.
- Lightweight error surfacing to global feedback state.
- Utility helpers centralized in `app/Leida/lib/*`.

## Documentation Source of Truth

- Keep curated documentation in `docs/founder-dashboard/*`.
- Preserve raw source READMEs in `docs/source-readmes/*`.
- Prefer adding new docs to this `docs/` tree instead of creating distributed READMEs in feature folders.
