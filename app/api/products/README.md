```sql
create table public.products (
  product_id uuid not null default gen_random_uuid (),
  practitioner_id uuid not null,
  title text null,
  created timestamp with time zone not null default now(),
  updated timestamp with time zone null default now(),
  data jsonb null,
  constraint products_pkey primary key (product_id),
  constraint products_practitioner_id_fkey foreign key (practitioner_id) references practitioners (practitioner_id) on update cascade on delete cascade
) tablespace pg_default;

create index if not exists products_practitioner_idx on public.products(practitioner_id);
create index if not exists products_updated_idx on public.products(updated desc nulls last);

-- Hardening for existing tables
alter table public.products
  alter column practitioner_id set not null;

-- RLS: users can only see and change products that belong to their practitioner row.
alter table public.products enable row level security;

drop policy if exists products_select_own on public.products;
create policy products_select_own
  on public.products
  for select
  to authenticated
  using (practitioner_id = auth.uid());

drop policy if exists products_insert_own on public.products;
create policy products_insert_own
  on public.products
  for insert
  to authenticated
  with check (practitioner_id = auth.uid());

drop policy if exists products_update_own on public.products;
create policy products_update_own
  on public.products
  for update
  to authenticated
  using (practitioner_id = auth.uid())
  with check (practitioner_id = auth.uid());

drop policy if exists products_delete_own on public.products;
create policy products_delete_own
  on public.products
  for delete
  to authenticated
  using (practitioner_id = auth.uid());

-- optional migration from legacy columns into data jsonb
update public.products
set data = jsonb_strip_nulls(
  coalesce(data, '{}'::jsonb)
  || jsonb_build_object(
    'name', name,
    'category', category,
    'sku', sku,
    'price', price,
    'description', description,
    'notes', notes
  )
);

alter table public.products
  drop column if exists name,
  drop column if exists category,
  drop column if exists sku,
  drop column if exists price,
  drop column if exists description,
  drop column if exists notes;
```
