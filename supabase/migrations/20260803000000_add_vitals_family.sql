-- Family tier: vitals tracking.
-- 1) Creates the vitals table if missing (it exists in some environments via
--    the dashboard; columns are added if missing so this is safe to rerun).
-- 2) Owner can CRUD their own vitals.
-- 3) A Family-plan owner (caregiver) can read and log vitals for any linked,
--    active family member, matching the existing medications/dose_logs rules.

create table if not exists public.vitals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  value numeric not null,
  value_secondary numeric,
  unit text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.vitals
  add column if not exists value_secondary numeric,
  add column if not exists unit text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now();

alter table public.vitals enable row level security;

-- Owner manages their own readings.
drop policy if exists "vitals_owner_manage" on public.vitals;
create policy "vitals_owner_manage"
  on public.vitals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Family owners can read linked members' vitals.
drop policy if exists "family_owner_read_member_vitals" on public.vitals;
create policy "family_owner_read_member_vitals"
  on public.vitals
  for select
  using (
    exists (
      select 1 from public.family_members fm
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = vitals.user_id
    )
  );

-- Caregiver can log a reading on behalf of a linked member.
drop policy if exists "family_owner_insert_member_vitals" on public.vitals;
create policy "family_owner_insert_member_vitals"
  on public.vitals
  for insert
  with check (
    exists (
      select 1 from public.family_members fm
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = vitals.user_id
    )
  );
