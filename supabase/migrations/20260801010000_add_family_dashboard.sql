-- Family tier: shared household dashboard.
-- Creates/repairs the family_members table and adds the RLS policies that let
-- a Family-plan owner (caregiver) invite members by email and, once the invite
-- is accepted (member_user_id linked), read that member's medications and dose
-- history so the shared dashboard can render.

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_email text not null,
  member_name text,
  member_user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.family_members enable row level security;

-- Owner (caregiver) manages their own invites/links.
drop policy if exists "family_owner_manage" on public.family_members;
create policy "family_owner_manage"
  on public.family_members
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Invited member (email match) can see their pending invite.
drop policy if exists "family_invitee_read" on public.family_members;
create policy "family_invitee_read"
  on public.family_members
  for select
  using (lower(auth.jwt() ->> 'email') = lower(member_email));

-- Invited member can accept their pending invite (links their account).
drop policy if exists "family_invitee_accept" on public.family_members;
create policy "family_invitee_accept"
  on public.family_members
  for update
  using (lower(auth.jwt() ->> 'email') = lower(member_email) and member_user_id is null)
  with check (lower(auth.jwt() ->> 'email') = lower(member_email));

-- Family owners can read linked members' medications.
drop policy if exists "family_owner_read_member_medications" on public.medications;
create policy "family_owner_read_member_medications"
  on public.medications
  for select
  using (
    exists (
      select 1 from public.family_members fm
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = medications.user_id
    )
  );

-- Family owners can read linked members' dose logs.
drop policy if exists "family_owner_read_member_dose_logs" on public.dose_logs;
create policy "family_owner_read_member_dose_logs"
  on public.dose_logs
  for select
  using (
    exists (
      select 1 from public.family_members fm
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = dose_logs.user_id
    )
  );

-- Family owners can read linked members' profiles (name, avatar) for display.
drop policy if exists "family_owner_read_member_profiles" on public.profiles;
create policy "family_owner_read_member_profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1 from public.family_members fm
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = profiles.id
    )
  );
