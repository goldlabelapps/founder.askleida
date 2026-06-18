# Products Module

Manages the Leida product catalogue. There are two parallel tracks:

1. **Awin / Lookfantastic affiliate feed** — ingest an external feed into Supabase, browse it, and promote rows into native Leida products.
2. **Leida products** — CRUD on first-party products stored in the `products` Supabase table.

---

## Directory structure

```
Products/
├── Products.tsx              # Root layout component
├── actions/
│   ├── awinCheckFeed.tsx     # GET /api/awin/lookfantastic/sync
│   ├── awinIngestFeed.tsx    # GET /api/awin/lookfantastic/ingest
│   ├── awinSyncFeed.tsx      # Orchestrates check → conditional ingest
│   ├── fetchAwinLookfantasticBrands.tsx
│   ├── fetchAwinLookfantasticCategories.tsx
│   ├── searchAwinLookfantastic.tsx
│   ├── setAwinLookfantasticSelection.tsx
│   ├── updateProduct.tsx
│   └── deleteProduct.tsx
└── components/
    ├── AwinFeedMonitor.tsx   # Feed status dashboard, trigger sync/ingest
    ├── AwinProductFinder.tsx # Search/browse the ingested Awin feed
    ├── ProductCard.tsx       # Clickable card for a single Leida product
    ├── ProductDash.tsx       # Lists all Leida products
    ├── ProductNew.tsx        # Create a new Leida product (pre-fills from Awin)
    ├── ProductSearch.tsx     # Stub – not yet implemented
    └── ProductUpdate.tsx     # Edit / delete a Leida product
```

---

## Components

### `Products`

Root entry point. Sets the NXAdmin header (`title: "Products"`, `icon: "products"`). Reads the current pathname; if a UUID segment is detected (i.e. a detail route) it renders `null` and defers to the child route.

### `AwinFeedMonitor`

Monitors the health of the Awin Lookfantastic feed pipeline.

- On mount: initialises Supabase, loads the 25 most recent rows from `awin_feed_snapshots`, and fetches the last row from `awin_lookfantastic` to display the most-recent ingest timestamp.
- **Check table** button: calls `GET /api/awin` to resolve the configured table name, then cross-references the Supabase schema to confirm the table exists.
- **Sync feed** button: dispatches `awinSyncFeed` (check → optional ingest).
- **Force ingest** button: dispatches `awinIngestFeed` unconditionally.

### `AwinProductFinder`

Paginated search interface over the ingested Awin catalogue.

- Text query, category, and brand filters. Brand options are filtered by the selected category.
- Debounced auto-search (300 ms) on any filter change; explicit submit also supported.
- Pagination is 25 rows per page. Prev/Next and full `Pagination` controls.
- Keyboard navigation (arrow keys) moves the selection highlight through the current page.
- The selected row's `unique_key` is stored in Redux via `setAwinLookfantasticSelection`; `ProductNew` reads this to pre-fill the creation form.

### `ProductCard`

Displays a single Leida product. Parses the `data` JSON blob (or string) to surface `name`, `description`, `category`, and `price`. Clicking navigates to `/products/:product_id`.

### `ProductDash`

Fetches and lists all rows from the `products` Supabase table as `ProductCard` instances. Initialises Supabase on mount (guarded by a ref to prevent duplicate fetches).

### `ProductNew`

Form to create a new Leida product. Writes to the `products` table via `saveSupabaseRecord`. If a row is selected in `AwinProductFinder`, the form is pre-populated with `product_name`, `description`, `category_name`, and `search_price` from that row. On success, navigates back to `/products`.

### `ProductUpdate`

Reads the product ID from the URL (`pathname.split('/').pop()`). Loads the matching row from the `products` table and renders an editable form. The **Save** button is only enabled when at least one field has changed. Supports deleting via a `ConfirmAction` dialog, which dispatches `deleteProduct` and then navigates back to `/products`.

### `ProductSearch`

Placeholder component – currently renders only the text "ProductSearch". Not yet wired up.

---

## Actions

| Action | Method | Endpoint / Operation |
|---|---|---|
| `awinCheckFeed` | `GET` | `/api/awin/lookfantastic/sync` |
| `awinIngestFeed` | `GET` | `/api/awin/lookfantastic/ingest` |
| `awinSyncFeed` | — | Dispatches `awinCheckFeed`; if `changed !== false`, also dispatches `awinIngestFeed` |
| `searchAwinLookfantastic` | `GET` | `/api/awin/lookfantastic/search?q=&category=&brand=&limit=&offset=` |
| `fetchAwinLookfantasticBrands` | `GET` | `/api/awin/lookfantastic/brands?category=&limit=` |
| `fetchAwinLookfantasticCategories` | `GET` | `/api/awin/lookfantastic/categories` |
| `setAwinLookfantasticSelection` | — | Sets `leida.products.awinSearch.selectedKey` in Redux |
| `updateProduct` | — | `saveSupabaseRecord` on `products` table |
| `deleteProduct` | — | `deleteSupabaseRecord` on `products` table |

### `updateProduct` validation

- `product_id` must be present.
- `title` must be a non-empty string after trimming.
- `price` must parse to a finite number.

### `deleteProduct` validation

- `product_id` must be present.

---

## Redux state shape

All keys live under the `leida` namespace (managed by `Uberedux` via `setUbereduxKey`).

```
leida.products.awinFeedCheck
  .loading          boolean
  .error            string | null
  .response         any
  .lastCheckedAt    ISO 8601 string

leida.products.awinFeedIngest
  .loading          boolean
  .error            string | null
  .response         any
  .lastRunAt        ISO 8601 string

leida.products.awinSearch
  .loading          boolean
  .error            string | null
  .query            string
  .category         string
  .brand            string
  .limit            number
  .offset           number
  .rows             array
  .count            number
  .brands           array
  .brandsLoading    boolean
  .brandsError      string | null
  .categories       array
  .categoriesLoading boolean
  .categoriesError  string | null
  .selectedKey      string | null   ← unique_key of the selected Awin row
```

---

## Supabase tables

| Table | Purpose |
|---|---|
| `products` | Native Leida product records |
| `awin_lookfantastic` | Ingested rows from the Awin Lookfantastic feed |
| `awin_feed_snapshots` | Per-sync snapshots used to detect feed changes |

---

## Dependencies

- **Next.js App Router** — `usePathname`, `useRouter`
- **MUI v6** — layout and UI components
- **Redux / Uberedux** — `useDispatch`, `setUbereduxKey`
- **Supabase sub-module** — `initSupabase`, `fetchSupabaseRows`, `saveSupabaseRecord`, `deleteSupabaseRecord`, `fetchSupabaseSchema`, `useSupabase`
- **NXAdmin** — `setNXAdmin` (header config), `Editable`
- **DesignSystem** — `Icon`, `navigateTo`, `setFeedback`, `ConfirmAction`
