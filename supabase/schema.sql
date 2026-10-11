create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null default 0 check (price >= 0),
  status text not null default 'available' check (status in ('available', 'occupied', 'construction')),
  image_urls text[] not null default '{}',
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

create unique index payments_one_per_period on public.payments (lease_id, period_year, period_month) where status <> 'rejected';
create index payments_period_idx on public.payments (period_year, period_month);

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

grant select on public.spaces to anon, authenticated;
grant insert, update, delete on public.spaces to authenticated;
grant select, insert, update, delete on public.tenants, public.leases, public.payments to authenticated;

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  ('spaces', 'spaces', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('contracts', 'contracts', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
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
