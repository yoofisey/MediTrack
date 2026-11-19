-- Cron execution tracking table.
-- Every cron invocation logs start, finish, success/failure, and details.

create table if not exists public.cron_runs (
  id uuid default gen_random_uuid() primary key,
  job_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'failed')),
  details jsonb,
  error text
);

create index if not exists idx_cron_runs_job_started on public.cron_runs (job_name, started_at desc);

alter table public.cron_runs enable row level security;

-- Only service_role can access (cron jobs run server-side).
create policy "Service role manages cron_runs"
  on public.cron_runs
  for all
  to service_role
  using (true)
  with check (true);

-- Auto-purge runs older than 30 days.
create or replace function public.purge_old_cron_runs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.cron_runs where started_at < now() - interval '30 days';
end;
$$;

revoke all on function public.purge_old_cron_runs() from authenticated;
revoke all on function public.purge_old_cron_runs() from anon;
grant execute on function public.purge_old_cron_runs() to service_role;
