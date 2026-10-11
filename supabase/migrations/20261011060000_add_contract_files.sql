alter table public.leases add column if not exists contract_files text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contracts', 'contracts', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do update set
  file_size_limit = 20971520,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'contracts_admin_all') then
    create policy "contracts_admin_all" on storage.objects
      for all to authenticated
      using (bucket_id = 'contracts' and public.is_admin())
      with check (bucket_id = 'contracts' and public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'contracts_tenant_select') then
    create policy "contracts_tenant_select" on storage.objects
      for select to authenticated
      using (
        bucket_id = 'contracts'
        and exists (
          select 1 from public.leases l
          where l.tenant_id = (select auth.uid())
            and (storage.foldername(name))[1] = l.id::text
        )
      );
  end if;
end
$$;
