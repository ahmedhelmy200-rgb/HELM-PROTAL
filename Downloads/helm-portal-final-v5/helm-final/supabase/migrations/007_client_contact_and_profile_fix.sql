alter table public.clients add column if not exists avatar_url text;

drop policy if exists "client insert own contact notification" on public.notifications;
create policy "client insert own contact notification" on public.notifications
for insert to authenticated
with check (
  public.is_staff_email(auth.email())
  or (
    reference_type = 'ClientContact'
    and created_by = auth.email()
  )
);
