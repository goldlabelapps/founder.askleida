```sql
create table public.products (
  product_id uuid not null default gen_random_uuid (),
  practitioner_id uuid null,
  title text null,
  created timestamp with time zone not null default now(),
  updated timestamp with time zone null default now(),
  data jsonb null,
  constraint products_pkey primary key (product_id),
  constraint products_practitioner_id_fkey foreign key (practitioner_id) references practitioners (practitioner_id) on update cascade on delete cascade
) tablespace pg_default;

create index if not exists products_practitioner_idx on public.products(practitioner_id);
create index if not exists products_updated_idx on public.products(updated desc nulls last);

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
