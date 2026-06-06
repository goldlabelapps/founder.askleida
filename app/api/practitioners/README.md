```sql
create table public.practitioners (
  practitioner_id uuid not null default gen_random_uuid(),
  title text null,
  created timestamp with time zone not null default now(),
  updated timestamp with time zone null default now(),
  data jsonb null,
  constraint practitioners_pkey primary key (practitioner_id)
) tablespace pg_default;

create index if not exists practitioners_updated_idx on public.practitioners(updated desc nulls last);
```