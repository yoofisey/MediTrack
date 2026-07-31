alter table public.medications
  add column if not exists cost_per_package numeric,
  add column if not exists cost_currency text,
  add column if not exists image_url text,
  add column if not exists doctor_name text,
  add column if not exists doctor_phone text,
  add column if not exists pharmacy_name text,
  add column if not exists pharmacy_phone text,
  add column if not exists prescription_refill text,
  add column if not exists next_refill_date text,
  add column if not exists last_refill_date text,
  add column if not exists reminder_times text,
  add column if not exists color text;

alter table public.profiles
  add column if not exists timezone text,
  add column if not exists last_checkin_date text;

notify pgrst, 'reload schema';
