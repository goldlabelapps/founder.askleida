# Leida Founder (NX Module)


Leida is a client-side dashboard module used inside the NX Admin app shell.

This README is written as a handoff for a React/Next developer who needs to continue work without the original author.

## What this module provides

- Dashboard UI entry points:
	- `FounderDash`
	- `Supabase`
	- `SupabaseDash`
	- `DashNav`
- Redux-oriented actions/hooks for Leida state:
	- `initLeida()`
	- `fetchLeida(route)`
	- `setLeida(key, value)`
	- `useLeida()`
	- `useLeidaBus(route)`
- Founder dashboard scoped state helpers:
	- `initDash()`
	- `setDash(key, value)`
	- `useDash()`
- Utility:
	- `normalizeLeidaRouteKey(route)`

All public exports are re-exported from `index.tsx`.

## Current architecture

Leida assumes a global Redux tree managed by the host app (via `Uberedux`), and uses `redux-thunk` style async actions.

### State shape used by Leida

Leida reads/writes these keys:

```ts
state.redux.leida = {
	initted?: boolean,
	bus?: {
		[route: string]: {
			loading: boolean,
			error: string | null,
			data: any[]
		}
	}
}

state.redux.nxAdmin = {
	header?: {
		title?: string,
		icon?: string
	},
	dash?: {
		title?: string,
		hero?: string,
		panels?: string[]
	}
}
```

### Data flow

1. `initLeida()` sets `leida.initted = true` once.
2. `initLeida()` immediately dispatches `fetchLeida('/api/supabase')`.
3. `fetchLeida(route)` normalizes route keys using `normalizeLeidaRouteKey()`.
4. Route-specific bus state is updated in `leida.bus[routeKey]`:
	 - set loading true
	 - fetch GET JSON
	 - parse list-like data into `data`
	 - set loading false and persist data or error
5. Errors are mirrored to global `redux.error` via `setUbereduxKey({ key: 'error', value: msg })`.

## Important files

- `index.tsx`: module export surface
- `actions/initLeida.tsx`: one-time module initialization and initial fetch
- `actions/fetchLeida.tsx`: route-scoped fetch + bus cache updates
- `actions/setLeida.tsx`: immutable merge updates to `redux.leida`
- `hooks/useLeida.tsx`: selectors for full leida slice and route bus entries
- `components/FounderDash/FounderDash.tsx`: main founder dashboard page
- `components/DashNav/DashNav.tsx`: local dashboard navigation + sign out confirmation
- `lib/normalizeLeidaRouteKey.ts`: route key normalization utility

## Using Leida in Next.js

Leida components/hooks are client-side (`'use client'`). Use them only in client components.

Minimal example:

```tsx
'use client';

import * as React from 'react';
import { useDispatch } from '../NX/Uberedux';
import { initLeida, useLeidaBus } from '../Leida';

export default function ExampleLeidaConsumer() {
	const dispatch = useDispatch();
	const didInit = React.useRef(false);
	const supabaseBus = useLeidaBus('/api/supabase');

	React.useEffect(() => {
		if (!didInit.current) {
			dispatch(initLeida());
			didInit.current = true;
		}
	}, [dispatch]);

	if (supabaseBus.loading) return <div>Loading...</div>;
	if (supabaseBus.error) return <div>Error: {supabaseBus.error}</div>;

	return <pre>{JSON.stringify(supabaseBus.data, null, 2)}</pre>;
}
```

## Route normalization behavior

`normalizeLeidaRouteKey(route)` converts values as follows:

- `https://...` or `http://...` -> unchanged
- `/api/foo` -> unchanged
- `/foo` -> `/api/foo`
- `foo` -> `/api/foo`
- empty string -> `''` (fetch is aborted with a global error)

This means `useLeidaBus('/supabase')` and `useLeidaBus('supabase')` both resolve to the same bus key: `/api/supabase`.

## Extending this module

### Add a new data source

1. Pick a route (for example `/api/newSource`).
2. Dispatch `fetchLeida('/api/newSource')` from an init flow or user action.
3. Read it via `useLeidaBus('/api/newSource')`.
4. Render loading/error/data states from the bus entry.

### Add a new nav destination

1. Add item in `components/DashNav/DashNav.tsx` `navItems` array.
2. Create corresponding page/component in the host app route.
3. Keep route strings aligned with `buildAdminPath()` behavior.

### Add stronger typing

Current code intentionally uses `any` in several selectors/actions for speed.
Good next step is introducing:

- `LeidaState`
- `LeidaBusEntry<T>`
- typed thunk `Dispatch`
- typed root selector state

## Current status and known gaps

- `components/Supabase/components/SupabaseDash.tsx` is currently a placeholder UI.
- `components/README.tsx` currently does not render user-facing content.
- Error handling is functional but globally coarse (`redux.error` string).
- No dedicated tests in this module yet.

## Recommended next tasks

1. Add unit tests for `normalizeLeidaRouteKey()` and `parseArrayData()` behavior.
2. Add integration tests for `fetchLeida()` bus transitions:
	 - idle -> loading -> success
	 - idle -> loading -> error
3. Replace `any` with typed interfaces for Leida and NX Admin slices.
4. Flesh out `SupabaseDash` with real data rendering from `useLeidaBus('/api/supabase')`.

## Notes for maintainers

- Keep all Leida route keys normalized before indexing `leida.bus`.
- Preserve immutable updates when touching nested Redux state.
- Avoid duplicate fetches by honoring the existing `loading` guard in `fetchLeida()`.



## Leida Dashboard

- Practitioners
- Products
    - Awin afilliate / Lookfantastic 

## Awin Lookfantastic Data

### awin_lookfantastic

- 25,707 product rows from a single Lookfantastic snapshot are currently stored here.
- Every row is for LOOKFANTASTIC UK and uses GBP pricing.

The table is structured as flattened product fields plus a raw JSON payload.
Core populated fields include:

- aw_product_id
- merchant_product_id
- product_name
- search_price
- aw_deep_link
- merchant_deep_link
- merchant_name
- category_name

The raw data payload typically contains keys like:

- product_name
- description
- category_name
- category_id
- aw_image_url
- merchant_image_url
- display_price
- store_price
- delivery_cost
- language
- data_feed_id

Largest categories right now:

- Cosmetics (11,723)
- Skincare (7,203)
- Haircare (3,757)
- Fragrance (2,677)

Price range:

- minimum: 1.40
- maximum: 2160
- average: ~42.70

Identifier fields currently empty across the table include:

- ean
- upc
- isbn
- mpn
- product_gtin
- stock_quantity
- source_last_updated
    
![NextJS](public/shared/png/python.png)  
> Wei Zang's son

_[powered by °NX](https://goldlabel.pro/nx/nx-admin)_ 
