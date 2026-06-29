```sql
create table public.practitioners (
  practitioner_id uuid not null,
  title text null,
  created timestamp with time zone not null default now(),
  updated timestamp with time zone null default now(),
  data jsonb null,
  constraint practitioners_pkey primary key (practitioner_id),
  constraint practitioners_auth_user_fkey foreign key (practitioner_id) references auth.users (id) on update cascade on delete cascade
) tablespace pg_default;

create index if not exists practitioners_updated_idx on public.practitioners(updated desc nulls last);

-- Hardening for existing tables
alter table public.practitioners
  alter column practitioner_id drop default;

-- RLS: each authenticated user can only operate on their own practitioner row.
alter table public.practitioners enable row level security;

drop policy if exists practitioners_select_own on public.practitioners;
create policy practitioners_select_own
  on public.practitioners
  for select
  to authenticated
  using (practitioner_id = auth.uid());

drop policy if exists practitioners_insert_own on public.practitioners;
create policy practitioners_insert_own
  on public.practitioners
  for insert
  to authenticated
  with check (practitioner_id = auth.uid());

drop policy if exists practitioners_update_own on public.practitioners;
create policy practitioners_update_own
  on public.practitioners
  for update
  to authenticated
  using (practitioner_id = auth.uid())
  with check (practitioner_id = auth.uid());

drop policy if exists practitioners_delete_own on public.practitioners;
create policy practitioners_delete_own
  on public.practitioners
  for delete
  to authenticated
  using (practitioner_id = auth.uid());
```