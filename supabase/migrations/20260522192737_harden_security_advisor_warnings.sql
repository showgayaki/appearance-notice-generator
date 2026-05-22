create schema if not exists private;

revoke all on schema private from public;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

drop policy if exists "regular programs are writable by admin users" on public.regular_programs;
create policy "regular programs are writable by admin users"
on public.regular_programs for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "guest programs are writable by admin users" on public.guest_programs;
create policy "guest programs are writable by admin users"
on public.guest_programs for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "post headers are writable by admin users" on public.post_headers;
create policy "post headers are writable by admin users"
on public.post_headers for all
using (private.is_admin())
with check (private.is_admin());

revoke all on function public.is_admin() from public;
drop function if exists public.is_admin();

revoke all on table public.admin_users from public;
revoke all on table public.admin_users from anon;
revoke all on table public.admin_users from authenticated;

revoke all on function public.ensure_single_default_post_header() from public;
revoke all on function public.ensure_single_default_post_header() from anon;
revoke all on function public.ensure_single_default_post_header() from authenticated;
