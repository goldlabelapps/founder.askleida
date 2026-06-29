-- Optional reset for local/dev reruns.
drop table if exists public.products_awin cascade;

create table if not exists public.products_awin (
  products_awin_id uuid not null default gen_random_uuid(),
  slug text null,
  created timestamp with time zone null default now(),
  updated timestamp with time zone null default now(),
  data jsonb null,
  constraint products_awin_pkey primary key (products_awin_id)
) TABLESPACE pg_default;

create unique index if not exists products_awin_slug_unique_idx
  on public.products_awin using btree (slug)
  TABLESPACE pg_default;

create index if not exists products_awin_created_idx
  on public.products_awin using btree (created)
  TABLESPACE pg_default;
