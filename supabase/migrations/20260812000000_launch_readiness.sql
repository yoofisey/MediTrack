-- Launch-readiness fixes (2026-08-12).
--
-- Apply via the Supabase dashboard SQL editor or `supabase db push`.

-- 1. profiles.email: Paystack verify/webhook upgrade paths match customers by
--    profiles.email, but the column never existed in any migration.
alter table public.profiles add column if not exists email text;

-- Keep profiles.email in sync when a user's auth email changes (or is set).
create or replace function public.sync_profile_email()
returns trigger
language plpgsql security definer
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists profiles_sync_email on auth.users;
create trigger profiles_sync_email
  after insert or update of email on auth.users
  for each row execute function public.sync_profile_email();

-- Backfill existing profiles from auth.users.
update public.profiles p
  set email = u.email
  from auth.users u
  where p.id = u.id and p.email is distinct from u.email;

-- 2. Drop duplicate legacy family_members policies. They OR'd with the
--    plan-gated family_owner_manage_insert policy (its with_check requires the
--    owner to be on the family plan), letting any user insert family rows
--    without a paid plan. The legacy policies are fully replaced by the
--    family_owner_manage_* set.
drop policy if exists "Owners can insert family members" on public.family_members;
drop policy if exists "Owners can update family members" on public.family_members;
drop policy if exists "Owners can view family members" on public.family_members;
drop policy if exists "Owners can delete family members" on public.family_members;

-- 3. profiles DELETE policy: ProfileTab "delete account" silently no-oped
--    under RLS (no DELETE policy), leaving the PII row behind.
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);
