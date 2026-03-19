-- Harden portal permissions and allow self-service client onboarding by the authenticated email owner.

create or replace function public.is_client_email(target_email text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.clients c where c.email = target_email
  );
$$;

-- Clients table: staff can manage all; authenticated users can create/update/select only their own row.
drop policy if exists "clients scoped select clients" on public.clients;
create policy "clients scoped select clients" on public.clients
for select to authenticated
using (
  public.is_staff_email(auth.email())
  or email = auth.email()
);

create policy "self register client row" on public.clients
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

-- Restrict remaining staff-only business tables.
drop policy if exists "authenticated select legal_templates" on public.legal_templates;
create policy "staff only legal templates select" on public.legal_templates
for select to authenticated using (public.is_staff_email(auth.email()));
drop policy if exists "authenticated insert legal_templates" on public.legal_templates;
create policy "staff only legal templates insert" on public.legal_templates
for insert to authenticated with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated update legal_templates" on public.legal_templates;
create policy "staff only legal templates update" on public.legal_templates
for update to authenticated using (public.is_staff_email(auth.email())) with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated delete legal_templates" on public.legal_templates;
create policy "staff only legal templates delete" on public.legal_templates
for delete to authenticated using (public.is_staff_email(auth.email()));

drop policy if exists "authenticated select messages" on public.messages;
create policy "scoped messages select" on public.messages
for select to authenticated using (
  public.is_staff_email(auth.email())
  or exists (
    select 1 from public.conversations conv
    where conv.id::text = public.messages.conversation_id
    and conv.participants::text ilike '%' || auth.email() || '%'
  )
);
drop policy if exists "authenticated insert messages" on public.messages;
create policy "scoped messages insert" on public.messages
for insert to authenticated with check (
  public.is_staff_email(auth.email())
  or sender_email = auth.email()
);
drop policy if exists "authenticated update messages" on public.messages;
create policy "staff only messages update" on public.messages
for update to authenticated using (public.is_staff_email(auth.email())) with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated delete messages" on public.messages;
create policy "staff only messages delete" on public.messages
for delete to authenticated using (public.is_staff_email(auth.email()));

drop policy if exists "authenticated select conversations" on public.conversations;
create policy "scoped conversations select" on public.conversations
for select to authenticated using (
  public.is_staff_email(auth.email())
  or participants::text ilike '%' || auth.email() || '%'
);
drop policy if exists "authenticated insert conversations" on public.conversations;
create policy "scoped conversations insert" on public.conversations
for insert to authenticated with check (
  public.is_staff_email(auth.email())
  or participants::text ilike '%' || auth.email() || '%'
);
drop policy if exists "authenticated update conversations" on public.conversations;
create policy "scoped conversations update" on public.conversations
for update to authenticated using (
  public.is_staff_email(auth.email())
  or participants::text ilike '%' || auth.email() || '%'
) with check (
  public.is_staff_email(auth.email())
  or participants::text ilike '%' || auth.email() || '%'
);
drop policy if exists "authenticated delete conversations" on public.conversations;
create policy "staff only conversations delete" on public.conversations
for delete to authenticated using (public.is_staff_email(auth.email()));

drop policy if exists "authenticated select sessions" on public.sessions;
create policy "staff only sessions select" on public.sessions
for select to authenticated using (public.is_staff_email(auth.email()));
drop policy if exists "authenticated insert sessions" on public.sessions;
create policy "staff only sessions insert" on public.sessions
for insert to authenticated with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated update sessions" on public.sessions;
create policy "staff only sessions update" on public.sessions
for update to authenticated using (public.is_staff_email(auth.email())) with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated delete sessions" on public.sessions;
create policy "staff only sessions delete" on public.sessions
for delete to authenticated using (public.is_staff_email(auth.email()));

drop policy if exists "authenticated select tasks" on public.tasks;
create policy "staff only tasks select" on public.tasks
for select to authenticated using (public.is_staff_email(auth.email()));
drop policy if exists "authenticated insert tasks" on public.tasks;
create policy "staff only tasks insert" on public.tasks
for insert to authenticated with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated update tasks" on public.tasks;
create policy "staff only tasks update" on public.tasks
for update to authenticated using (public.is_staff_email(auth.email())) with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated delete tasks" on public.tasks;
create policy "staff only tasks delete" on public.tasks
for delete to authenticated using (public.is_staff_email(auth.email()));

drop policy if exists "authenticated select office_settings" on public.office_settings;
create policy "read office settings for authenticated" on public.office_settings
for select to authenticated using (true);
drop policy if exists "authenticated insert office_settings" on public.office_settings;
create policy "staff only office settings insert" on public.office_settings
for insert to authenticated with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated update office_settings" on public.office_settings;
create policy "staff only office settings update" on public.office_settings
for update to authenticated using (public.is_staff_email(auth.email())) with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated delete office_settings" on public.office_settings;
create policy "staff only office settings delete" on public.office_settings
for delete to authenticated using (public.is_staff_email(auth.email()));

drop policy if exists "authenticated select expenses" on public.expenses;
create policy "staff only expenses select" on public.expenses
for select to authenticated using (public.is_staff_email(auth.email()));
drop policy if exists "authenticated insert expenses" on public.expenses;
create policy "staff only expenses insert" on public.expenses
for insert to authenticated with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated update expenses" on public.expenses;
create policy "staff only expenses update" on public.expenses
for update to authenticated using (public.is_staff_email(auth.email())) with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated delete expenses" on public.expenses;
create policy "staff only expenses delete" on public.expenses
for delete to authenticated using (public.is_staff_email(auth.email()));

drop policy if exists "authenticated select events" on public.events;
create policy "staff only events select" on public.events
for select to authenticated using (public.is_staff_email(auth.email()));
drop policy if exists "authenticated insert events" on public.events;
create policy "staff only events insert" on public.events
for insert to authenticated with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated update events" on public.events;
create policy "staff only events update" on public.events
for update to authenticated using (public.is_staff_email(auth.email())) with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated delete events" on public.events;
create policy "staff only events delete" on public.events
for delete to authenticated using (public.is_staff_email(auth.email()));

drop policy if exists "authenticated select founder_profiles" on public.founder_profiles;
create policy "staff only founder profiles select" on public.founder_profiles
for select to authenticated using (public.is_staff_email(auth.email()));
drop policy if exists "authenticated insert founder_profiles" on public.founder_profiles;
create policy "staff only founder profiles insert" on public.founder_profiles
for insert to authenticated with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated update founder_profiles" on public.founder_profiles;
create policy "staff only founder profiles update" on public.founder_profiles
for update to authenticated using (public.is_staff_email(auth.email())) with check (public.is_staff_email(auth.email()));
drop policy if exists "authenticated delete founder_profiles" on public.founder_profiles;
create policy "staff only founder profiles delete" on public.founder_profiles
for delete to authenticated using (public.is_staff_email(auth.email()));

-- Storage: keep uploads private to owner or staff.
update storage.buckets set public = false where id = 'uploads';

drop policy if exists "Public can read uploads" on storage.objects;
drop policy if exists "Authenticated can upload uploads" on storage.objects;
drop policy if exists "Authenticated can update uploads" on storage.objects;
drop policy if exists "Authenticated can delete uploads" on storage.objects;

create policy "scoped upload read" on storage.objects
for select to authenticated
using (
  bucket_id = 'uploads' and (
    owner = auth.uid()
    or public.is_staff_email(auth.email())
  )
);

create policy "scoped upload insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'uploads' and owner = auth.uid()
);

create policy "scoped upload update" on storage.objects
for update to authenticated
using (
  bucket_id = 'uploads' and (
    owner = auth.uid()
    or public.is_staff_email(auth.email())
  )
)
with check (
  bucket_id = 'uploads' and (
    owner = auth.uid()
    or public.is_staff_email(auth.email())
  )
);

create policy "scoped upload delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'uploads' and (
    owner = auth.uid()
    or public.is_staff_email(auth.email())
  )
);
