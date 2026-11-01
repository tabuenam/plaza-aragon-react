insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do update set
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'receipts_admin_all') then
    create policy "receipts_admin_all" on storage.objects
      for all to authenticated
      using (bucket_id = 'receipts' and public.is_admin())
      with check (bucket_id = 'receipts' and public.is_admin());
  end if;
end
$$;
