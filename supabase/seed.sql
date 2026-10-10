create extension if not exists pgcrypto;

insert into public.spaces (id, name, description, price, status, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', 'Local 1', 'Local comercial en planta baja con frente a la calle, ideal para tienda o consultorio.', 8000, 'occupied', 1),
  ('22222222-2222-2222-2222-222222222222', 'Local 2', 'Local comercial en planta baja con amplia vitrina y excelente visibilidad.', 8000, 'occupied', 2),
  ('33333333-3333-3333-3333-333333333333', 'Local 3', 'Local comercial nuevo, actualmente en construcción. Reserva el tuyo.', 8500, 'construction', 3),
  ('44444444-4444-4444-4444-444444444444', 'Local 4', 'Local comercial nuevo, actualmente en construcción. Reserva el tuyo.', 8500, 'construction', 4),
  ('55555555-5555-5555-5555-555555555555', 'Local 5', 'Local comercial nuevo, actualmente en construcción. Reserva el tuyo.', 9000, 'construction', 5)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin@plaza-aragon.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"admin"}',
    '{"name":"Administrador Plaza Aragón"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'inquilino1@plaza-aragon.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Farmacia San José"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'inquilino2@plaza-aragon.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Café Olanchito"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  email_confirmed_at = excluded.email_confirmed_at;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@plaza-aragon.com"}'::jsonb,
    'email',
    'a0000000-0000-0000-0000-000000000001',
    now(),
    now(),
    now()
  ),
  (
    'b0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '{"sub":"b0000000-0000-0000-0000-000000000001","email":"inquilino1@plaza-aragon.com"}'::jsonb,
    'email',
    'b0000000-0000-0000-0000-000000000001',
    now(),
    now(),
    now()
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    '{"sub":"b0000000-0000-0000-0000-000000000002","email":"inquilino2@plaza-aragon.com"}'::jsonb,
    'email',
    'b0000000-0000-0000-0000-000000000002',
    now(),
    now(),
    now()
  )
on conflict (id) do nothing;

insert into public.tenants (id, name, contact_info) values
  ('b0000000-0000-0000-0000-000000000001', 'Farmacia San José', '+504 9988-7766'),
  ('b0000000-0000-0000-0000-000000000002', 'Café Olanchito', '+504 9955-4433')
on conflict (id) do update set
  name = excluded.name,
  contact_info = excluded.contact_info;

insert into public.leases (id, space_id, tenant_id, start_date, end_date, monthly_rent, active) values
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000001', '2026-01-01', '2026-12-31', 8000, true),
  ('c0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-000000000002', '2026-02-01', '2027-01-31', 8000, true)
on conflict (id) do update set
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  monthly_rent = excluded.monthly_rent,
  active = excluded.active;

insert into public.payments (id, lease_id, amount, payment_date, period_month, period_year, receipt_path, status, reviewed_at) values
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 8000, '2026-09-02', 9, 2026, 'b0000000-0000-0000-0000-000000000001/comprobante-septiembre.jpg', 'verified', '2026-09-03T10:00:00Z'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 8000, '2026-10-02', 10, 2026, 'b0000000-0000-0000-0000-000000000001/comprobante-octubre.jpg', 'pending', null),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 8000, '2026-09-05', 9, 2026, 'b0000000-0000-0000-0000-000000000002/comprobante-septiembre.jpg', 'verified', '2026-09-06T14:30:00Z')
on conflict (id) do nothing;
