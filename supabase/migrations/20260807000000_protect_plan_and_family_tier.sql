-- Tier protection migration.
--
-- Context: paid tiers (pro/family/enterprise) were grantable directly from the
-- client (signup metadata, onboarding, ProfileTab "upgrade", URL ?trxref= param).
-- This migration makes the database the source of truth:
--
--   1. profiles.plan can only be changed by the service role (the Paystack
--      verify/webhook routes). Authenticated clients are always forced to
--      'free' on insert and cannot change an existing plan on update.
--   2. family_members rows can only be inserted by a user whose own profile is
--      on the family plan.
--
-- NOTE: no `supabase` CLI is available in this repo's dev environment, so this
-- file is NOT auto-applied. Apply it via the Supabase dashboard SQL editor
-- (Project > SQL Editor > New query) against the luxtopkzdyflbejwgniq project,
-- or run `supabase db push` once the CLI is set up.

-- 1. Protect profiles.plan -----------------------------------------------

drop trigger if exists profiles_protect_plan on public.profiles;
drop function if exists public.protect_plan();

create or replace function public.protect_plan()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.plan := coalesce(old.plan, 'free');
  return new;
end;
$$;

create trigger profiles_protect_plan
  before insert or update of plan on public.profiles
  for each row execute function public.protect_plan();

-- 2. Family-tier gating on family_members inserts ------------------------

drop policy if exists "family_owner_manage" on public.family_members;
create policy "family_owner_manage"
  on public.family_members
  for select
  using (auth.uid() = owner_id);

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
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "family_owner_manage_delete" on public.family_members;
create policy "family_owner_manage_delete"
  on public.family_members
  for delete
  using (auth.uid() = owner_id);
