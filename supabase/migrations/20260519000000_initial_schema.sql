create table if not exists public.regular_programs (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null check (weekday between 0 and 6),
  start_time text not null,
  end_time text not null,
  station_name text not null,
  program_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appearances (
  id uuid primary key default gen_random_uuid(),
  appearance_date date not null,
  start_time text not null,
  end_time text not null,
  station_name text not null,
  program_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.period_headers (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (start_date, end_date)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists regular_programs_set_updated_at on public.regular_programs;
create trigger regular_programs_set_updated_at
before update on public.regular_programs
for each row execute function public.set_updated_at();

drop trigger if exists appearances_set_updated_at on public.appearances;
create trigger appearances_set_updated_at
before update on public.appearances
for each row execute function public.set_updated_at();

drop trigger if exists period_headers_set_updated_at on public.period_headers;
create trigger period_headers_set_updated_at
before update on public.period_headers
for each row execute function public.set_updated_at();

alter table public.regular_programs enable row level security;
alter table public.appearances enable row level security;
alter table public.period_headers enable row level security;

drop policy if exists "regular programs are publicly readable" on public.regular_programs;
create policy "regular programs are publicly readable"
on public.regular_programs for select
using (true);

drop policy if exists "regular programs are writable by authenticated users" on public.regular_programs;
create policy "regular programs are writable by authenticated users"
on public.regular_programs for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "appearances are publicly readable" on public.appearances;
create policy "appearances are publicly readable"
on public.appearances for select
using (true);

drop policy if exists "appearances are writable by authenticated users" on public.appearances;
create policy "appearances are writable by authenticated users"
on public.appearances for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "period headers are publicly readable" on public.period_headers;
create policy "period headers are publicly readable"
on public.period_headers for select
using (true);

drop policy if exists "period headers are writable by authenticated users" on public.period_headers;
create policy "period headers are writable by authenticated users"
on public.period_headers for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
