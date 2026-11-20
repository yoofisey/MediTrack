-- Rotate the send-reminders pg_cron job to authenticate with CRON_SECRET.
--
-- Companion to 20260808020000_schedule_send_reminders.sql. The send-reminders
-- edge function requires `Bearer <CRON_SECRET>` and fails closed when missing.
--
-- APPLY THIS with the real secret: replace '<CRON_SECRET>' below with the
-- SAME value configured as CRON_SECRET in:
--   * the send-reminders edge function environment, and
--   * Vercel (so /api/cron/send-reminders also works if you keep it).
--
-- Apply via the Supabase dashboard SQL editor against your project.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'send-reminders-5min') then
    perform cron.unschedule('send-reminders-5min');
  end if;
end $$;

select cron.schedule(
  'send-reminders-5min',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    ),
    body := '{}'
  )
  $cron$
);
