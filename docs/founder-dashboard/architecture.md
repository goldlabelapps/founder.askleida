# Architecture

## Top-Level Composition

Leida is exposed as a modular cartridge-like surface through `app/Leida/index.tsx`, which re-exports:

- Pages/components (dashboard, products, practitioners, queue, AWIN UI)
- Hooks (`useLeida`, `useLeidaBus`, domain hooks)
- Actions (`initLeida`, `fetchLeida`, `setLeida`, product/practitioner actions)
- Utility helpers (`app/Leida/lib/*`)

## Routing

Routing is centralized in `app/Leida/PageRouter.tsx` and driven by `next/navigation` pathname parsing.

- Default route resolves to `<FounderDash />`
- Practitioner routes support list, create, and update paths
- Product routes resolve to products home, AWIN, queue, and list surfaces

## State Shape (Operational)

Leida and related dashboard data are written into Redux namespaces, primarily:

```ts
state.redux.leida = {
  initted?: boolean,
  header?: { title?: string; icon?: string },
  dash?: { title?: string; hero?: string; panels?: string[] },
  bus?: Record<string, { loading: boolean; error: string | null; data: unknown[] }>
}
```

AWIN, practitioners, queue, and products maintain additional feature-specific state through their own action/hook sets.

## Initialization Flow

1. `initLeida()` marks module initialization.
2. `initLeida()` dispatches `initAWIN()` as part of startup.
3. Route/page components set header state (via `setLeida('header', ...)`) and run feature-specific initializers.

## Data Fetching Pattern

`fetchLeida(route)` provides normalized route-key fetching for list-like endpoints:

1. Normalize key with `normalizeLeidaRouteKey(route)`.
2. Set bus entry loading state.
3. Fetch JSON.
4. Parse to array via `parseArrayData`.
5. Persist result or error in `state.redux.leida.bus[routeKey]`.

Errors are also surfaced to global app feedback through Uberedux error key updates.
