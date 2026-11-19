-- Caregiver home redesign.
-- 1) Add profile-ish fields to family_members so a caregiver can record a
--    relationship, age, phone, a qualitative care note, and "managed" profiles
--    (a child/elderly parent who will not use the app themselves).
-- 2) Let the Family-plan owner act on behalf of a linked member: mark a dose
--    taken, and add/edit/delete that member's medications.

alter table public.family_members
  add column if not exists relationship text,
  add column if not exists age integer,
  add column if not exists phone text,
  add column if not exists care_note text,
  add column if not exists managed boolean not null default false;

-- Caregiver can mark a dose taken on behalf of a linked member.
drop policy if exists "family_owner_insert_member_dose_logs" on public.dose_logs;
create policy "family_owner_insert_member_dose_logs"
  on public.dose_logs
  for insert
  with check (
    exists (
      select 1 from public.family_members fm
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = dose_logs.user_id
    )
  );

-- Caregiver can add a medication for a linked member.
drop policy if exists "family_owner_insert_member_medications" on public.medications;
create policy "family_owner_insert_member_medications"
  on public.medications
  for insert
  with check (
    exists (
      select 1 from public.family_members fm
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = medications.user_id
    )
  );

-- Caregiver can edit a linked member's medication (e.g. log a refill).
drop policy if exists "family_owner_update_member_medications" on public.medications;
create policy "family_owner_update_member_medications"
  on public.medications
  for update
  using (
    exists (
      select 1 from public.family_members fm
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = medications.user_id
    )
  )
  with check (
    exists (
      select 1 from public.family_members fm
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = medications.user_id
    )
  );

-- Caregiver can delete a linked member's medication.
drop policy if exists "family_owner_delete_member_medications" on public.medications;
create policy "family_owner_delete_member_medications"
  on public.medications
  for delete
  using (
    exists (
      select 1 from public.family_members fm
      where fm.owner_id = auth.uid()
        and fm.status = 'active'
        and fm.member_user_id = medications.user_id
    )
  );
