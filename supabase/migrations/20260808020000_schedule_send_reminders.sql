<<<<<<< HEAD
﻿-- Schedule the send-reminders edge function every 5 minutes via pg_cron.
-- Vercel Hobby accounts cannot run crons more than once/day, so we use
-- Supabase pg_cron + pg_net to invoke the function instead. The function's
-- own claimTag() dedup makes frequent runs safe.
--
-- IMPORTANT: Do not hardcode project URLs or secrets in migrations.
-- Configure the Authorization header with your CRON_SECRET (same value used by
-- the send-reminders edge function and Vercel cron auth). See migration
-- 20261008010000_rotate_reminder_cron_secret.sql for the secure pattern.

=======
-- Schedule the send-reminders edge function every 5 minutes via pg_cron.
-- Vercel Hobby accounts cannot run crons more than once/day, so we use
-- Supabase pg_cron + pg_net to invoke the function instead. The function's
-- own claimTag() dedup makes frequent runs safe.
-- NOTE: The Authorization header uses the project anon key (public value).
>>>>>>> origin/main
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'send-reminders-5min') then
    perform cron.unschedule('send-reminders-5min');
  end if;
end $$;

<<<<<<< HEAD
-- Apply with real values in the Supabase SQL editor (do not commit secrets):
-- select cron.schedule(
--   'send-reminders-5min',
--   '*/5 * * * *',
--   $cron$
--   select net.http_post(
--     url := 'https://<PROJECT_REF>.functions.supabase.co/send-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <CRON_SECRET>'
--     ),
--     body := '{}'
--   )
--   $cron$
-- );
=======
select cron.schedule(
  'send-reminders-5min',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url := 'https://luxtopkzdyflbejwgniq.functions.supabase.co/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1eHRvcGt6ZHlmbGJlandnbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY5NzAsImV4cCI6MjA5NzkxMjk3MH0.zcvzd5vOBxw6xE00EIrt7NBcEnFa95FxODsD2h1M-OU'
    ),
    body := '{}'
  )
  $cron$
);
>>>>>>> origin/main
