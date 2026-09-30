-- remind_at_dose: when true (default), a full alarm fires at the exact
-- medication due time in addition to the user-selected lead reminder
-- (reminder_minutes). The Due-time reminder is what surfaces the full-screen
-- alarm overlay; the lead reminder is the softer "Reminder: X" notification.

alter table public.medications
  add column if not exists remind_at_dose boolean not null default true;

notify pgrst, 'reload schema';