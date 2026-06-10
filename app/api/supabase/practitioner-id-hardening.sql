-- Practitioner ID hardening migration
-- Run in Supabase SQL Editor (or your migration pipeline).

begin;

-- 1) Bind practitioners.practitioner_id to auth.users.id (no random defaults).
alter table public.practitioners
  alter column practitioner_id drop default;

-- Add FK only if missing.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'practitioners_auth_user_fkey'
      and conrelid = 'public.practitioners'::regclass
  ) then
    alter table public.practitioners
      add constraint practitioners_auth_user_fkey
      foreign key (practitioner_id)
      references auth.users (id)
      on update cascade
      on delete cascade;
  end if;
end $$;

-- 2) Require ownership link on child table.
alter table public.products
  alter column practitioner_id set not null;

-- 3) Enforce row ownership with RLS.
alter table public.practitioners enable row level security;
alter table public.products enable row level security;

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

commit;
