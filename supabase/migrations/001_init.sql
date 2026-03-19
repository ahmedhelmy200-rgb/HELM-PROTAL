-- Generated migration for HELM independent app
create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  email text unique not null,
  full_name text,
  role text not null default 'user',
  avatar_url text,
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now())
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  case_number text,
  title text not null,
  client_id text,
  client_name text not null,
  case_type text not null,
  court text,
  judge text,
  status text not null default 'جارية',
  priority text default 'متوسطة',
  next_session_date timestamptz,
  filing_date date,
  description text,
  fees numeric,
  paid_amount numeric default 0,
  assigned_lawyer text,
  opponent_name text,
  opponent_lawyer text
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  full_name text not null,
  client_type text default 'فرد',
  id_number text,
  phone text not null,
  email text,
  address text,
  nationality text,
  notes text,
  status text default 'نشط'
);

create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  from_email text not null,
  from_name text,
  to_email text not null,
  to_name text,
  status text not null default 'pending',
  message text
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  participants jsonb not null,
  participant_names jsonb,
  last_message text,
  last_message_date timestamptz,
  last_sender text
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  title text not null,
  case_id text,
  case_title text,
  case_number text,
  client_name text,
  doc_type text not null default 'أخرى',
  file_url text,
  file_name text,
  file_type text,
  submission_deadline timestamptz,
  status text not null default 'مسودة',
  ocr_text text,
  ocr_status text default 'لم يُعالج',
  folder text,
  notes text
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  title text not null,
  description text,
  date timestamptz not null,
  location text not null,
  event_type text not null,
  industry_focus text,
  max_attendees numeric,
  attendees jsonb,
  organizer_email text,
  organizer_name text,
  image_url text,
  is_virtual boolean
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  title text not null,
  amount numeric not null,
  category text default 'أخرى',
  expense_date date not null,
  case_id text,
  case_title text,
  client_name text,
  payment_method text default 'نقداً',
  receipt_url text,
  notes text,
  is_billable boolean default false,
  status text default 'مدفوع'
);

create table if not exists public.founder_profiles (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  user_email text,
  full_name text not null,
  photo_url text,
  startup_name text not null,
  one_liner text,
  bio text,
  industry text not null,
  funding_stage text not null,
  location text not null,
  linkedin_url text,
  twitter_url text,
  website_url text,
  looking_for jsonb
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  invoice_number text,
  client_name text not null,
  case_id text,
  case_title text,
  case_number text,
  issue_date date not null,
  due_date date,
  total_fees numeric not null,
  paid_amount numeric default 0,
  discount numeric default 0,
  vat_rate numeric default 5,
  status text not null default 'مسودة',
  items jsonb,
  notes text,
  payment_method text,
  office_name text,
  office_phone text,
  office_address text
);

create table if not exists public.legal_templates (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  title text not null,
  category text not null,
  case_type text,
  content text not null,
  description text,
  variables jsonb,
  is_favorite boolean default false,
  usage_count numeric default 0
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  conversation_id text not null,
  sender_email text not null,
  sender_name text,
  content text not null
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  title text not null,
  message text not null,
  type text not null default 'عام',
  reference_id text,
  reference_type text,
  is_read boolean default false,
  due_date timestamptz,
  user_email text
);

create table if not exists public.office_settings (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  office_name text not null,
  office_name_en text,
  lawyer_name text,
  license_number text,
  phone text,
  phone2 text,
  email text,
  website text,
  address text,
  city text,
  country text default 'الإمارات العربية المتحدة',
  logo_url text,
  stamp_url text,
  signature_url text,
  invoice_header_text text,
  invoice_footer_text text,
  invoice_notes_default text,
  bank_name text,
  bank_account text,
  iban text,
  vat_number text,
  primary_color text default '#1d4ed8',
  secondary_color text default '#f59e0b',
  sidebar_color text default '#1d4ed8',
  app_font text default 'Cairo',
  currency text default 'د.إ',
  specializations jsonb,
  working_hours text,
  social_twitter text,
  social_linkedin text,
  social_whatsapp text
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  case_id text not null,
  case_title text,
  case_number text,
  client_name text,
  session_date timestamptz not null,
  court text not null,
  hall text,
  session_type text default 'مرافعة',
  status text default 'قادمة',
  result text,
  next_session_date timestamptz,
  notes text,
  reminder_sent boolean default false
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  title text not null,
  description text,
  case_id text,
  case_title text,
  client_name text,
  task_type text default 'مهمة عامة',
  priority text default 'متوسطة',
  due_date timestamptz not null,
  status text not null default 'معلقة',
  assigned_to text
);
create or replace function public.set_updated_date()
returns trigger
language plpgsql
as $$
begin
  new.updated_date = timezone('utc', now());
  return new;
end;
$$;
drop trigger if exists trg_user_profiles_updated_date on public.user_profiles;
create trigger trg_user_profiles_updated_date before update on public.user_profiles for each row execute function public.set_updated_date();
alter table public.user_profiles enable row level security;
drop policy if exists "authenticated select user_profiles" on public.user_profiles;
create policy "authenticated select user_profiles" on public.user_profiles for select to authenticated using (true);
drop policy if exists "authenticated insert user_profiles" on public.user_profiles;
create policy "authenticated insert user_profiles" on public.user_profiles for insert to authenticated with check (true);
drop policy if exists "authenticated update user_profiles" on public.user_profiles;
create policy "authenticated update user_profiles" on public.user_profiles for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete user_profiles" on public.user_profiles;
create policy "authenticated delete user_profiles" on public.user_profiles for delete to authenticated using (true);
drop trigger if exists trg_cases_updated_date on public.cases;
create trigger trg_cases_updated_date before update on public.cases for each row execute function public.set_updated_date();
alter table public.cases enable row level security;
drop policy if exists "authenticated select cases" on public.cases;
create policy "authenticated select cases" on public.cases for select to authenticated using (true);
drop policy if exists "authenticated insert cases" on public.cases;
create policy "authenticated insert cases" on public.cases for insert to authenticated with check (true);
drop policy if exists "authenticated update cases" on public.cases;
create policy "authenticated update cases" on public.cases for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete cases" on public.cases;
create policy "authenticated delete cases" on public.cases for delete to authenticated using (true);
drop trigger if exists trg_clients_updated_date on public.clients;
create trigger trg_clients_updated_date before update on public.clients for each row execute function public.set_updated_date();
alter table public.clients enable row level security;
drop policy if exists "authenticated select clients" on public.clients;
create policy "authenticated select clients" on public.clients for select to authenticated using (true);
drop policy if exists "authenticated insert clients" on public.clients;
create policy "authenticated insert clients" on public.clients for insert to authenticated with check (true);
drop policy if exists "authenticated update clients" on public.clients;
create policy "authenticated update clients" on public.clients for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete clients" on public.clients;
create policy "authenticated delete clients" on public.clients for delete to authenticated using (true);
drop trigger if exists trg_connection_requests_updated_date on public.connection_requests;
create trigger trg_connection_requests_updated_date before update on public.connection_requests for each row execute function public.set_updated_date();
alter table public.connection_requests enable row level security;
drop policy if exists "authenticated select connection_requests" on public.connection_requests;
create policy "authenticated select connection_requests" on public.connection_requests for select to authenticated using (true);
drop policy if exists "authenticated insert connection_requests" on public.connection_requests;
create policy "authenticated insert connection_requests" on public.connection_requests for insert to authenticated with check (true);
drop policy if exists "authenticated update connection_requests" on public.connection_requests;
create policy "authenticated update connection_requests" on public.connection_requests for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete connection_requests" on public.connection_requests;
create policy "authenticated delete connection_requests" on public.connection_requests for delete to authenticated using (true);
drop trigger if exists trg_conversations_updated_date on public.conversations;
create trigger trg_conversations_updated_date before update on public.conversations for each row execute function public.set_updated_date();
alter table public.conversations enable row level security;
drop policy if exists "authenticated select conversations" on public.conversations;
create policy "authenticated select conversations" on public.conversations for select to authenticated using (true);
drop policy if exists "authenticated insert conversations" on public.conversations;
create policy "authenticated insert conversations" on public.conversations for insert to authenticated with check (true);
drop policy if exists "authenticated update conversations" on public.conversations;
create policy "authenticated update conversations" on public.conversations for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete conversations" on public.conversations;
create policy "authenticated delete conversations" on public.conversations for delete to authenticated using (true);
drop trigger if exists trg_documents_updated_date on public.documents;
create trigger trg_documents_updated_date before update on public.documents for each row execute function public.set_updated_date();
alter table public.documents enable row level security;
drop policy if exists "authenticated select documents" on public.documents;
create policy "authenticated select documents" on public.documents for select to authenticated using (true);
drop policy if exists "authenticated insert documents" on public.documents;
create policy "authenticated insert documents" on public.documents for insert to authenticated with check (true);
drop policy if exists "authenticated update documents" on public.documents;
create policy "authenticated update documents" on public.documents for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete documents" on public.documents;
create policy "authenticated delete documents" on public.documents for delete to authenticated using (true);
drop trigger if exists trg_events_updated_date on public.events;
create trigger trg_events_updated_date before update on public.events for each row execute function public.set_updated_date();
alter table public.events enable row level security;
drop policy if exists "authenticated select events" on public.events;
create policy "authenticated select events" on public.events for select to authenticated using (true);
drop policy if exists "authenticated insert events" on public.events;
create policy "authenticated insert events" on public.events for insert to authenticated with check (true);
drop policy if exists "authenticated update events" on public.events;
create policy "authenticated update events" on public.events for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete events" on public.events;
create policy "authenticated delete events" on public.events for delete to authenticated using (true);
drop trigger if exists trg_expenses_updated_date on public.expenses;
create trigger trg_expenses_updated_date before update on public.expenses for each row execute function public.set_updated_date();
alter table public.expenses enable row level security;
drop policy if exists "authenticated select expenses" on public.expenses;
create policy "authenticated select expenses" on public.expenses for select to authenticated using (true);
drop policy if exists "authenticated insert expenses" on public.expenses;
create policy "authenticated insert expenses" on public.expenses for insert to authenticated with check (true);
drop policy if exists "authenticated update expenses" on public.expenses;
create policy "authenticated update expenses" on public.expenses for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete expenses" on public.expenses;
create policy "authenticated delete expenses" on public.expenses for delete to authenticated using (true);
drop trigger if exists trg_founder_profiles_updated_date on public.founder_profiles;
create trigger trg_founder_profiles_updated_date before update on public.founder_profiles for each row execute function public.set_updated_date();
alter table public.founder_profiles enable row level security;
drop policy if exists "authenticated select founder_profiles" on public.founder_profiles;
create policy "authenticated select founder_profiles" on public.founder_profiles for select to authenticated using (true);
drop policy if exists "authenticated insert founder_profiles" on public.founder_profiles;
create policy "authenticated insert founder_profiles" on public.founder_profiles for insert to authenticated with check (true);
drop policy if exists "authenticated update founder_profiles" on public.founder_profiles;
create policy "authenticated update founder_profiles" on public.founder_profiles for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete founder_profiles" on public.founder_profiles;
create policy "authenticated delete founder_profiles" on public.founder_profiles for delete to authenticated using (true);
drop trigger if exists trg_invoices_updated_date on public.invoices;
create trigger trg_invoices_updated_date before update on public.invoices for each row execute function public.set_updated_date();
alter table public.invoices enable row level security;
drop policy if exists "authenticated select invoices" on public.invoices;
create policy "authenticated select invoices" on public.invoices for select to authenticated using (true);
drop policy if exists "authenticated insert invoices" on public.invoices;
create policy "authenticated insert invoices" on public.invoices for insert to authenticated with check (true);
drop policy if exists "authenticated update invoices" on public.invoices;
create policy "authenticated update invoices" on public.invoices for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete invoices" on public.invoices;
create policy "authenticated delete invoices" on public.invoices for delete to authenticated using (true);
drop trigger if exists trg_legal_templates_updated_date on public.legal_templates;
create trigger trg_legal_templates_updated_date before update on public.legal_templates for each row execute function public.set_updated_date();
alter table public.legal_templates enable row level security;
drop policy if exists "authenticated select legal_templates" on public.legal_templates;
create policy "authenticated select legal_templates" on public.legal_templates for select to authenticated using (true);
drop policy if exists "authenticated insert legal_templates" on public.legal_templates;
create policy "authenticated insert legal_templates" on public.legal_templates for insert to authenticated with check (true);
drop policy if exists "authenticated update legal_templates" on public.legal_templates;
create policy "authenticated update legal_templates" on public.legal_templates for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete legal_templates" on public.legal_templates;
create policy "authenticated delete legal_templates" on public.legal_templates for delete to authenticated using (true);
drop trigger if exists trg_messages_updated_date on public.messages;
create trigger trg_messages_updated_date before update on public.messages for each row execute function public.set_updated_date();
alter table public.messages enable row level security;
drop policy if exists "authenticated select messages" on public.messages;
create policy "authenticated select messages" on public.messages for select to authenticated using (true);
drop policy if exists "authenticated insert messages" on public.messages;
create policy "authenticated insert messages" on public.messages for insert to authenticated with check (true);
drop policy if exists "authenticated update messages" on public.messages;
create policy "authenticated update messages" on public.messages for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete messages" on public.messages;
create policy "authenticated delete messages" on public.messages for delete to authenticated using (true);
drop trigger if exists trg_notifications_updated_date on public.notifications;
create trigger trg_notifications_updated_date before update on public.notifications for each row execute function public.set_updated_date();
alter table public.notifications enable row level security;
drop policy if exists "authenticated select notifications" on public.notifications;
create policy "authenticated select notifications" on public.notifications for select to authenticated using (true);
drop policy if exists "authenticated insert notifications" on public.notifications;
create policy "authenticated insert notifications" on public.notifications for insert to authenticated with check (true);
drop policy if exists "authenticated update notifications" on public.notifications;
create policy "authenticated update notifications" on public.notifications for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete notifications" on public.notifications;
create policy "authenticated delete notifications" on public.notifications for delete to authenticated using (true);
drop trigger if exists trg_office_settings_updated_date on public.office_settings;
create trigger trg_office_settings_updated_date before update on public.office_settings for each row execute function public.set_updated_date();
alter table public.office_settings enable row level security;
drop policy if exists "authenticated select office_settings" on public.office_settings;
create policy "authenticated select office_settings" on public.office_settings for select to authenticated using (true);
drop policy if exists "authenticated insert office_settings" on public.office_settings;
create policy "authenticated insert office_settings" on public.office_settings for insert to authenticated with check (true);
drop policy if exists "authenticated update office_settings" on public.office_settings;
create policy "authenticated update office_settings" on public.office_settings for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete office_settings" on public.office_settings;
create policy "authenticated delete office_settings" on public.office_settings for delete to authenticated using (true);
drop trigger if exists trg_sessions_updated_date on public.sessions;
create trigger trg_sessions_updated_date before update on public.sessions for each row execute function public.set_updated_date();
alter table public.sessions enable row level security;
drop policy if exists "authenticated select sessions" on public.sessions;
create policy "authenticated select sessions" on public.sessions for select to authenticated using (true);
drop policy if exists "authenticated insert sessions" on public.sessions;
create policy "authenticated insert sessions" on public.sessions for insert to authenticated with check (true);
drop policy if exists "authenticated update sessions" on public.sessions;
create policy "authenticated update sessions" on public.sessions for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete sessions" on public.sessions;
create policy "authenticated delete sessions" on public.sessions for delete to authenticated using (true);
drop trigger if exists trg_tasks_updated_date on public.tasks;
create trigger trg_tasks_updated_date before update on public.tasks for each row execute function public.set_updated_date();
alter table public.tasks enable row level security;
drop policy if exists "authenticated select tasks" on public.tasks;
create policy "authenticated select tasks" on public.tasks for select to authenticated using (true);
drop policy if exists "authenticated insert tasks" on public.tasks;
create policy "authenticated insert tasks" on public.tasks for insert to authenticated with check (true);
drop policy if exists "authenticated update tasks" on public.tasks;
create policy "authenticated update tasks" on public.tasks for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete tasks" on public.tasks;
create policy "authenticated delete tasks" on public.tasks for delete to authenticated using (true);
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "Public can read uploads" on storage.objects;
create policy "Public can read uploads"
on storage.objects for select to public
using (bucket_id = 'uploads');

drop policy if exists "Authenticated can upload uploads" on storage.objects;
create policy "Authenticated can upload uploads"
on storage.objects for insert to authenticated
with check (bucket_id = 'uploads');

drop policy if exists "Authenticated can update uploads" on storage.objects;
create policy "Authenticated can update uploads"
on storage.objects for update to authenticated
using (bucket_id = 'uploads')
with check (bucket_id = 'uploads');

drop policy if exists "Authenticated can delete uploads" on storage.objects;
create policy "Authenticated can delete uploads"
on storage.objects for delete to authenticated
using (bucket_id = 'uploads');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    'user'
  )
  on conflict (email) do update set
    user_id = excluded.user_id,
    full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
