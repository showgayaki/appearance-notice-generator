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

create table if not exists public.guest_programs (
  id uuid primary key default gen_random_uuid(),
  program_date date not null,
  start_time text not null,
  end_time text not null,
  station_name text not null,
  program_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_headers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

drop trigger if exists guest_programs_set_updated_at on public.guest_programs;
create trigger guest_programs_set_updated_at
before update on public.guest_programs
for each row execute function public.set_updated_at();

drop trigger if exists post_headers_set_updated_at on public.post_headers;
create trigger post_headers_set_updated_at
before update on public.post_headers
for each row execute function public.set_updated_at();

alter table public.regular_programs enable row level security;
alter table public.guest_programs enable row level security;
alter table public.post_headers enable row level security;

drop policy if exists "regular programs are publicly readable" on public.regular_programs;
create policy "regular programs are publicly readable"
on public.regular_programs for select
using (true);

drop policy if exists "regular programs are writable by authenticated users" on public.regular_programs;
create policy "regular programs are writable by authenticated users"
on public.regular_programs for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "guest programs are publicly readable" on public.guest_programs;
create policy "guest programs are publicly readable"
on public.guest_programs for select
using (true);

drop policy if exists "guest programs are writable by authenticated users" on public.guest_programs;
create policy "guest programs are writable by authenticated users"
on public.guest_programs for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "post headers are publicly readable" on public.post_headers;
create policy "post headers are publicly readable"
on public.post_headers for select
using (true);

drop policy if exists "post headers are writable by authenticated users" on public.post_headers;
create policy "post headers are writable by authenticated users"
on public.post_headers for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
