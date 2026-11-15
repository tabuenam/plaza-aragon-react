alter table public.payments
  add column if not exists payment_type text not null default 'rent'
  check (payment_type in ('rent', 'electricity'));

drop index if exists public.payments_one_per_period;

create unique index payments_one_per_period
  on public.payments (lease_id, payment_type, period_year, period_month)
  where status <> 'rejected';

create index if not exists payments_type_period_idx
  on public.payments (payment_type, period_year, period_month);
