-- vital_targets: user-set daily goals for cumulative metrics (water intake).
-- Separate from vital_reminders (which stores *when* to nudge). This stores
-- *how much* the user is aiming for, so the Today tab and Vitals cards can show
-- progress. One row per (user, type); deleting the row clears the target.

create table if not exists public.vital_targets (
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  target_value numeric not null check (target_value > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, type)
);

alter table public.vital_targets enable row level security;

drop policy if exists "vital_targets_owner_manage" on public.vital_targets;
create policy "vital_targets_owner_manage"
  on public.vital_targets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';