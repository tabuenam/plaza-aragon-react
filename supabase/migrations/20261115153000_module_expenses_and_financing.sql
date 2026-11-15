create table if not exists public.module_expenses (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  category text not null check (category in ('construction', 'operating')),
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  reason text not null check (char_length(trim(reason)) > 0),
  receipt_path text,
  created_at timestamptz not null default now()
);

create index if not exists module_expenses_space_date_idx
  on public.module_expenses (space_id, expense_date desc);

create table if not exists public.module_financing (
  space_id uuid primary key references public.spaces (id) on delete cascade,
  financing_mode text not null default 'cash' check (financing_mode in ('cash', 'financed')),
  loan_amount numeric(12, 2) not null default 0 check (loan_amount >= 0),
  annual_interest_rate numeric(6, 4) not null default 0 check (annual_interest_rate >= 0),
  term_months int not null default 0 check (term_months >= 0),
  down_payment numeric(12, 2) check (down_payment is null or down_payment >= 0),
  updated_at timestamptz not null default now()
);

alter table public.module_expenses enable row level security;
alter table public.module_financing enable row level security;

grant select, insert, update, delete on public.module_expenses, public.module_financing to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'module_expenses_admin_all' and tablename = 'module_expenses') then
    create policy "module_expenses_admin_all" on public.module_expenses
      for all to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'module_financing_admin_all' and tablename = 'module_financing') then
    create policy "module_financing_admin_all" on public.module_financing
      for all to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('expenses', 'expenses', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do update set
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'expenses_admin_all' and tablename = 'objects' and schemaname = 'storage') then
    create policy "expenses_admin_all" on storage.objects
      for all to authenticated
      using (bucket_id = 'expenses' and public.is_admin())
      with check (bucket_id = 'expenses' and public.is_admin());
  end if;
end
$$;
