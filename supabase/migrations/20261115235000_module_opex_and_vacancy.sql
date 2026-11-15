alter table public.module_financing
  add column if not exists monthly_operating_expense numeric(12, 2) not null default 0 check (monthly_operating_expense >= 0),
  add column if not exists vacancy_rate_pct numeric(5, 2) not null default 0 check (vacancy_rate_pct >= 0 and vacancy_rate_pct <= 100);
