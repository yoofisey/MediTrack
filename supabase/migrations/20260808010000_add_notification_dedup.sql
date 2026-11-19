-- notification_dedup: cross-invocation dedup key for push messages sent by
-- supabase/functions/send-reminders/index.ts. The function inserts the tag
-- before sending; a conflict (ignoreDuplicates) means it was already sent.
create table if not exists public.notification_dedup (
  tag text primary key,
  sent_at timestamptz not null default now()
);

alter table public.notification_dedup enable row level security;

-- Only the service role writes/reads; end users never access this table.
create policy "Service role only"
  on public.notification_dedup
  for all
  to service_role
  using (true)
  with check (true);
