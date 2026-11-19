-- Server-side vital check reminders need the reminder config in the DB.
-- The client used to keep this only in localStorage (mt_vital_reminders);
-- this table mirrors that config so the send-reminders edge function can
-- compute next-due times per user/vital type.

create table if not exists public.vital_reminders (
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  interval_id text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, type)
);

alter table public.vital_reminders enable row level security;

-- Owner manages their own vital reminder config.
drop policy if exists "vital_reminders_owner_manage" on public.vital_reminders;
create policy "vital_reminders_owner_manage"
  on public.vital_reminders
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
