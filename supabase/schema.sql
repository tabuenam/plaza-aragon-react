create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null default 0 check (price >= 0),
  status text not null default 'available' check (status in ('available', 'occupied', 'construction')),
  image_urls text[] not null default '{}',
  business_name text check (business_name is null or char_length(business_name) <= 80),
  business_description text check (business_description is null or char_length(business_description) <= 350),
  business_image_urls text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.tenants (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  contact_info text not null default '',
  created_at timestamptz not null default now()
);

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete restrict,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  start_date date not null,
  end_date date not null,
  monthly_rent numeric(10, 2) not null check (monthly_rent > 0),
  active boolean not null default true,
  contract_files text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);

create unique index leases_one_active_per_space on public.leases (space_id) where active;
create index leases_tenant_id_idx on public.leases (tenant_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.leases (id) on delete cascade,
  payment_type text not null default 'rent' check (payment_type in ('rent', 'electricity')),
  amount numeric(10, 2) not null check (amount > 0),
  payment_date date not null default current_date,
  period_month int not null check (period_month between 1 and 12),
  period_year int not null check (period_year between 2020 and 2100),
  receipt_path text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index payments_one_per_period on public.payments (lease_id, payment_type, period_year, period_month) where status <> 'rejected';
create index payments_period_idx on public.payments (period_year, period_month);
create index payments_type_period_idx on public.payments (payment_type, period_year, period_month);

create table public.module_expenses (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  category text not null check (category in ('construction', 'operating')),
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  reason text not null check (char_length(trim(reason)) > 0),
  receipt_path text,
  created_at timestamptz not null default now()
);

create index module_expenses_space_date_idx on public.module_expenses (space_id, expense_date desc);

create table public.module_financing (
  space_id uuid primary key references public.spaces (id) on delete cascade,
  financing_mode text not null default 'cash' check (financing_mode in ('cash', 'financed')),
  loan_amount numeric(12, 2) not null default 0 check (loan_amount >= 0),
  annual_interest_rate numeric(6, 4) not null default 0 check (annual_interest_rate >= 0),
  term_months int not null default 0 check (term_months >= 0),
  down_payment numeric(12, 2) check (down_payment is null or down_payment >= 0),
  monthly_operating_expense numeric(12, 2) not null default 0 check (monthly_operating_expense >= 0),
  vacancy_rate_pct numeric(5, 2) not null default 0 check (vacancy_rate_pct >= 0 and vacancy_rate_pct <= 100),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

alter table public.spaces enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.payments enable row level security;
alter table public.module_expenses enable row level security;
alter table public.module_financing enable row level security;

grant select on public.spaces to anon, authenticated;
grant insert, update, delete on public.spaces to authenticated;
grant select, insert, update, delete on public.tenants, public.leases, public.payments, public.module_expenses, public.module_financing to authenticated;

create policy "spaces_select_all" on public.spaces
  for select to anon, authenticated using (true);

create policy "spaces_admin_write" on public.spaces
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "tenants_select_own_or_admin" on public.tenants
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());

create policy "tenants_admin_write" on public.tenants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "leases_select_own_or_admin" on public.leases
  for select to authenticated using (tenant_id = (select auth.uid()) or public.is_admin());

create policy "leases_admin_write" on public.leases
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "payments_select_own_or_admin" on public.payments
  for select to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.leases l
      where l.id = lease_id and l.tenant_id = (select auth.uid())
    )
  );

create policy "payments_tenant_insert" on public.payments
  for insert to authenticated with check (
    status = 'pending'
    and admin_note is null
    and reviewed_at is null
    and split_part(receipt_path, '/', 1) = (select auth.uid())::text
    and exists (
      select 1 from public.leases l
      where l.id = lease_id and l.tenant_id = (select auth.uid()) and l.active
    )
  );

create policy "payments_admin_write" on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "module_expenses_admin_all" on public.module_expenses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "module_financing_admin_all" on public.module_financing
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('receipts', 'receipts', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']),
  ('spaces', 'spaces', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('contracts', 'contracts', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']),
  ('expenses', 'expenses', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do nothing;

create policy "receipts_tenant_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "receipts_select_own_or_admin" on storage.objects
  for select to authenticated using (
    bucket_id = 'receipts'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

create policy "receipts_admin_all" on storage.objects
  for all to authenticated using (bucket_id = 'receipts' and public.is_admin())
  with check (bucket_id = 'receipts' and public.is_admin());

create policy "spaces_admin_all" on storage.objects
  for all to authenticated using (bucket_id = 'spaces' and public.is_admin())
  with check (bucket_id = 'spaces' and public.is_admin());

create policy "contracts_admin_all" on storage.objects
  for all to authenticated using (bucket_id = 'contracts' and public.is_admin())
  with check (bucket_id = 'contracts' and public.is_admin());

create policy "contracts_tenant_select" on storage.objects
  for select to authenticated using (
    bucket_id = 'contracts'
    and exists (
      select 1 from public.leases l
      where l.tenant_id = (select auth.uid())
        and (storage.foldername(name))[1] = l.id::text
    )
  );

create policy "expenses_admin_all" on storage.objects
  for all to authenticated using (bucket_id = 'expenses' and public.is_admin())
  with check (bucket_id = 'expenses' and public.is_admin());
