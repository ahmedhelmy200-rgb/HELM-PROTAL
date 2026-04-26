create or replace function public.is_staff_email(target_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.email = target_email
      and up.role in ('admin','staff','lawyer')
  );
$$;

revoke all on function public.is_staff_email(text) from public;
grant execute on function public.is_staff_email(text) to authenticated;

drop policy if exists "self insert clients" on public.clients;
drop policy if exists "self update own client row" on public.clients;

create policy "self insert clients" on public.clients
for insert to authenticated
with check (
  public.is_staff_email(auth.email())
  or email = auth.email()
);

create policy "self update own client row" on public.clients
for update to authenticated
using (
  public.is_staff_email(auth.email())
  or email = auth.email()
)
with check (
  public.is_staff_email(auth.email())
  or email = auth.email()
);
