alter table public.user_profiles alter column role set default 'user';

alter table public.office_settings add column if not exists theme_mode text default 'system';
alter table public.office_settings add column if not exists features jsonb default '{}'::jsonb;

create or replace function public.is_staff_email(target_email text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.user_profiles up
    where up.email = target_email and up.role in ('admin','staff','lawyer')
  );
$$;

-- Restrict client-facing data to the matching client email while keeping staff access open.
drop policy if exists "authenticated select clients" on public.clients;
create policy "clients scoped select clients" on public.clients
for select to authenticated
using (
  public.is_staff_email(auth.email())
  or email = auth.email()
);

drop policy if exists "authenticated update clients" on public.clients;
create policy "staff update clients" on public.clients
for update to authenticated
using (public.is_staff_email(auth.email()))
with check (public.is_staff_email(auth.email()));

drop policy if exists "authenticated insert clients" on public.clients;
create policy "staff insert clients" on public.clients
for insert to authenticated
with check (public.is_staff_email(auth.email()));

drop policy if exists "authenticated delete clients" on public.clients;
create policy "staff delete clients" on public.clients
for delete to authenticated
using (public.is_staff_email(auth.email()));

-- Cases / invoices / documents visible to the matching client by full name or all staff.
drop policy if exists "authenticated select cases" on public.cases;
create policy "scoped select cases" on public.cases
for select to authenticated
using (
  public.is_staff_email(auth.email())
  or exists (
    select 1 from public.clients c where c.email = auth.email() and c.full_name = public.cases.client_name
  )
);

drop policy if exists "authenticated insert cases" on public.cases;
create policy "staff insert cases" on public.cases
for insert to authenticated
with check (public.is_staff_email(auth.email()));

drop policy if exists "authenticated update cases" on public.cases;
create policy "staff update cases" on public.cases
for update to authenticated
using (public.is_staff_email(auth.email()))
with check (public.is_staff_email(auth.email()));

drop policy if exists "authenticated delete cases" on public.cases;
create policy "staff delete cases" on public.cases
for delete to authenticated
using (public.is_staff_email(auth.email()));

drop policy if exists "authenticated select invoices" on public.invoices;
create policy "scoped select invoices" on public.invoices
for select to authenticated
using (
  public.is_staff_email(auth.email())
  or exists (
    select 1 from public.clients c where c.email = auth.email() and c.full_name = public.invoices.client_name
  )
);

drop policy if exists "authenticated insert invoices" on public.invoices;
create policy "staff insert invoices" on public.invoices
for insert to authenticated
with check (public.is_staff_email(auth.email()));

drop policy if exists "authenticated update invoices" on public.invoices;
create policy "staff update invoices" on public.invoices
for update to authenticated
using (public.is_staff_email(auth.email()))
with check (public.is_staff_email(auth.email()));

drop policy if exists "authenticated delete invoices" on public.invoices;
create policy "staff delete invoices" on public.invoices
for delete to authenticated
using (public.is_staff_email(auth.email()));

drop policy if exists "authenticated select documents" on public.documents;
create policy "scoped select documents" on public.documents
for select to authenticated
using (
  public.is_staff_email(auth.email())
  or exists (
    select 1 from public.clients c where c.email = auth.email() and c.full_name = public.documents.client_name
  )
);

drop policy if exists "authenticated insert documents" on public.documents;
create policy "client upload documents" on public.documents
for insert to authenticated
with check (
  public.is_staff_email(auth.email())
  or exists (
    select 1 from public.clients c where c.email = auth.email() and c.full_name = public.documents.client_name
  )
);

drop policy if exists "authenticated update documents" on public.documents;
create policy "staff or client update own documents" on public.documents
for update to authenticated
using (
  public.is_staff_email(auth.email())
  or exists (
    select 1 from public.clients c where c.email = auth.email() and c.full_name = public.documents.client_name
  )
)
with check (
  public.is_staff_email(auth.email())
  or exists (
    select 1 from public.clients c where c.email = auth.email() and c.full_name = public.documents.client_name
  )
);

drop policy if exists "authenticated delete documents" on public.documents;
create policy "staff or client delete own documents" on public.documents
for delete to authenticated
using (
  public.is_staff_email(auth.email())
  or exists (
    select 1 from public.clients c where c.email = auth.email() and c.full_name = public.documents.client_name
  )
);

drop policy if exists "authenticated select notifications" on public.notifications;
create policy "scoped select notifications" on public.notifications
for select to authenticated
using (
  public.is_staff_email(auth.email())
  or user_email = auth.email()
);
