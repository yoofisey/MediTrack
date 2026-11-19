create table if not exists public.payment_references (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null,
  plan text not null check (plan in ('pro', 'family')),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, reference)
);

alter table public.payment_references enable row level security;

create policy "Users can read own payment references"
  on public.payment_references
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Service role manages payment references"
  on public.payment_references
  for all
  to service_role
  using (true)
  with check (true);

-- Now add paid_at to profiles
alter table public.profiles
  add column if not exists paid_at timestamptz;

-- Backfill existing paid profiles
update public.profiles p
set paid_at = (
  select max(pr.paid_at)
  from public.payment_references pr
  where pr.user_id = p.id
)
where p.plan in ('pro', 'family')
  and p.paid_at is null;

-- Downgrade function
create or replace function public.downgrade_expired_subscriptions()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set plan = 'free', paid_at = null
  where plan in ('pro', 'family')
    and paid_at is not null
    and paid_at < now() - interval '21 days';
end;
$$;

revoke all on function public.downgrade_expired_subscriptions() from authenticated;
revoke all on function public.downgrade_expired_subscriptions() from anon;
grant execute on function public.downgrade_expired_subscriptions() to service_role;
