alter table public.medications
  add column if not exists cost_per_package numeric,
  add column if not exists cost_currency text,
  add column if not exists image_url text;

comment on column public.medications.cost_per_package is 'Cost of one full package/refill in the medication currency';
comment on column public.medications.cost_currency is 'ISO currency code for cost_per_package (e.g. GHS, NGN, USD)';
comment on column public.medications.image_url is 'Optional photo of the medication';
