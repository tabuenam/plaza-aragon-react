alter table public.spaces
  add column if not exists business_name text
    check (business_name is null or char_length(business_name) <= 80),
  add column if not exists business_description text
    check (business_description is null or char_length(business_description) <= 350),
  add column if not exists business_image_urls text[] not null default '{}';
