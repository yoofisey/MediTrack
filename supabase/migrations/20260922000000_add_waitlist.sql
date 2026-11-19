-- Waitlist: let people in "coming soon" / non-ready countries drop an email so
-- we can notify them the moment payments go live for their country. No auth
-- needed to join — that's the whole point (they haven't signed up yet).

create table if not exists public.waitlist (
  id bigint generated always as identity primary key,
  email text not null,
  country char(2) not null default 'GH',
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

-- Dedupe by normalized email + country so a single person isn't queued twice.
create unique index if not exists waitlist_email_country_idx
  on public.waitlist (lower(email), country);

alter table public.waitlist enable row level security;

-- Anyone may insert their email (anonymous visitor landing on a "coming soon"
-- country). No select/update policy — the waitlist is write-only for visitors;
-- reading it privately is via Supabase dashboard/Studio only.
create policy "Anyone can join the waitlist"
  on public.waitlist for insert
  to anon, authenticated
  with check (
    email is not null
    and email <> ''
    and char_length(email) <= 254
    and country ~ '^[A-Z]{2}$'
  );
