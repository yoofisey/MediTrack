-- RLS hardening for family access (2026-10-08).
--
-- Apply via the Supabase dashboard SQL editor (Project > SQL Editor > New query)
-- against the luxtopkzdyflbejwgniq project.
--
-- Fixes found in the app audit:
--
--   1. family_invitee_accept let an invitee write ANY value into member_user_id
--      (only the email had to match). A malicious account that knew the invitee's
--      email could therefore link themselves to the family without the owner's
--      consent. Now the member_user_id must equal the caller's own auth.uid(),
--      so an invitee can only claim their own account.
--
--   2. The family_owner_* readability policies on medications/dose_logs/vitals/
--      profiles/visits did NOT verify the owner is on the family plan. Any user
--      could become an "owner" of a row by inserting a family_members link
--      pointing at a victim (invite_flow requires the invitee accept, but a
--      bypassed/older link or a reused policy could leak). Every policy now
--      requires EXISTS (owner on family plan) in BOTH using and with check.

-- 1. Invitee acceptance can only claim the caller's own uid -----------------
drop policy if exists "family_invitee_accept" on public.family_members;
create policy "family_invitee_accept"
  on public.family_members
  for update
  using (
    lower(auth.jwt() ->> 'email') = lower(member_email)
    and member_user_id is null
  )
  with check (
    lower(auth.jwt() ->> 'email') = lower(member_email)
    and member_user_id = auth.uid()
  );

-- Invitee may also read pending invitations addressed to them.
drop policy if exists "family_invitee_read" on public.family_members;
create policy "family_invitee_read"
  on public.family_members
  for select
  using (lower(auth.jwt() ->> 'email') = lower(member_email));

-- 2. Plan-gate every family owner policy (owner must be on the family plan) -

drop policy if exists "family_owner_manage" on public.family_members;
create policy "family_owner_manage"
  on public.family_members
  for select
  using (
    auth.uid() = owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.plan = 'family'
    )
  );

drop policy if exists "family_owner_manage_insert" on public.family_members;
create policy "family_owner_manage_insert"
  on public.family_members
  for insert
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.plan = 'family'
    )
  );

drop policy if exists "family_owner_manage_write" on public.family_members;
create policy "family_owner_manage_write"
  on public.family_members
  for update
  using (
    auth.uid() = owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.plan = 'family'
    )
  )
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.plan = 'family'
    )
  );

drop policy if exists "family_owner_manage_delete" on public.family_members;
create policy "family_owner_manage_delete"
  on public.family_members
  for delete
  using (
    auth.uid() = owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.plan = 'family'
    )
  );

-- medications
drop policy if exists "family_owner_read_member_medications" on public.medications;
create policy "family_owner_read_member_medications"
  on public.medications
  for select
  using (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = medications.user_id
    )
  );

drop policy if exists "family_owner_insert_member_medications" on public.medications;
create policy "family_owner_insert_member_medications"
  on public.medications
  for insert
  with check (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = medications.user_id
    )
  );

drop policy if exists "family_owner_update_member_medications" on public.medications;
create policy "family_owner_update_member_medications"
  on public.medications
  for update
  using (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = medications.user_id
    )
  )
  with check (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = medications.user_id
    )
  );

drop policy if exists "family_owner_delete_member_medications" on public.medications;
create policy "family_owner_delete_member_medications"
  on public.medications
  for delete
  using (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = medications.user_id
    )
  );

-- dose_logs
drop policy if exists "family_owner_read_member_dose_logs" on public.dose_logs;
create policy "family_owner_read_member_dose_logs"
  on public.dose_logs
  for select
  using (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = dose_logs.user_id
    )
  );

drop policy if exists "family_owner_insert_member_dose_logs" on public.dose_logs;
create policy "family_owner_insert_member_dose_logs"
  on public.dose_logs
  for insert
  with check (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = dose_logs.user_id
    )
  );

-- vitals
drop policy if exists "family_owner_read_member_vitals" on public.vitals;
create policy "family_owner_read_member_vitals"
  on public.vitals
  for select
  using (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = vitals.user_id
    )
  );

drop policy if exists "family_owner_insert_member_vitals" on public.vitals;
create policy "family_owner_insert_member_vitals"
  on public.vitals
  for insert
  with check (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = vitals.user_id
    )
  );

-- profiles: family owners may read linked members' profile rows.
drop policy if exists "family_owner_read_member_profiles" on public.profiles;
create policy "family_owner_read_member_profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = profiles.id
    )
  );

-- visits: family owners may read/update member-scheduled visits via member_key.
drop policy if exists "family_owner_read_member_visits" on public.visits;
create policy "family_owner_read_member_visits"
  on public.visits
  for select
  using (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and 'fm_' || fm.id = visits.member_key
    )
  );

drop policy if exists "family_owner_update_member_visits" on public.visits;
create policy "family_owner_update_member_visits"
  on public.visits
  for update
  using (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and 'fm_' || fm.id = visits.member_key
    )
  )
  with check (
    exists (
      select 1 from public.family_members fm
      join public.profiles p on p.id = auth.uid() and p.plan = 'family'
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and 'fm_' || fm.id = visits.member_key
    )
  );