-- Visits are now stored server-side so that a Family-plan caregiver's scheduled
-- visits appear on the linked member's own plan (the old localStorage-only
-- storage could never sync across accounts).
--
-- Model:
--   user_id      – the account that created/scheduled the visit (caregiver or self)
--   member_key   – "fm_<family_members.id>" when scheduled for a family member,
--                  otherwise NULL for the account's own visits

create table if not exists public.visits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_key text,
  date text not null,
  time text,
  doctor text,
  facility text,
  reason text,
  notes text,
  reminder_minutes integer,
  status text,
  created_at timestamptz not null default now()
);

alter table public.visits enable row level security;

-- The creating account manages their own visits (self + ones they scheduled).
drop policy if exists "visit_owner_manage" on public.visits;
create policy "visit_owner_manage"
  on public.visits
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A linked family member can see visits that were scheduled for them.
drop policy if exists "visit_member_read" on public.visits;
create policy "visit_member_read"
  on public.visits
  for select
  using (
    exists (
      select 1 from public.family_members fm
      where fm.member_user_id = auth.uid()
        and 'fm_' || fm.id = visits.member_key
    )
  );

-- A linked family member can mark their scheduled visits attended/missed.
drop policy if exists "visit_member_update" on public.visits;
create policy "visit_member_update"
  on public.visits
  for update
  using (
    exists (
      select 1 from public.family_members fm
      where fm.member_user_id = auth.uid()
        and 'fm_' || fm.id = visits.member_key
    )
  )
  with check (
    exists (
      select 1 from public.family_members fm
      where fm.member_user_id = auth.uid()
        and 'fm_' || fm.id = visits.member_key
    )
  );
