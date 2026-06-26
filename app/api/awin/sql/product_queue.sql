create table public.product_queue (
  queue_id uuid not null default gen_random_uuid(),
  practitioner_id uuid not null,
  source text not null default 'awin',
  source_table text null default 'awin_lookfantastic',
  source_product_id text null,
  decision text not null,
  status text not null default 'pending',
  product_id uuid null,
  data jsonb null,
  created timestamp with time zone null default now(),
  updated timestamp with time zone null default now(),
  constraint product_queue_pkey primary key (queue_id),
  constraint product_queue_decision_check check (decision in ('queue', 'delete')),
  constraint product_queue_status_check check (status in ('pending', 'done', 'failed'))
) TABLESPACE pg_default;

create index if not exists idx_product_queue_practitioner_id
  on public.product_queue using btree (practitioner_id) TABLESPACE pg_default;

create index if not exists idx_product_queue_status
  on public.product_queue using btree (status) TABLESPACE pg_default;

create index if not exists idx_product_queue_source_product_id
  on public.product_queue using btree (source_product_id) TABLESPACE pg_default;

create unique index if not exists uq_product_queue_pending_product_decision
  on public.product_queue using btree (practitioner_id, source, source_table, source_product_id, decision)
  TABLESPACE pg_default
  where status = 'pending' and source_product_id is not null;
