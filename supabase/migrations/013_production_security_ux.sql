-- NevGenç v17 — production güvenlik sertleştirmesi
-- Yönetici yazma işlemlerinde AAL2, topluluk gönderi oran sınırı ve Storage path kontrolü.

create schema if not exists private;

create or replace function private.has_aal2()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
$$;
revoke all on function private.has_aal2() from public,anon;
grant execute on function private.has_aal2() to authenticated,service_role;

-- Denetim kaydını yalnız RLS'in izin verdiği platform yöneticileri okuyabilir.
-- 008/012 migration'larında tablo yetkileri sıkılaştırıldığı için SELECT ayrı olarak geri verilir.
grant select on public.content_audit_log to authenticated;

-- Topluluk yöneticisinin kamuya açık profil kartını değiştirmesi de yetkili işlemdir.
drop policy if exists "admins insert own public community profile" on public.community_admin_public_profiles;
create policy "admins insert own public community profile"
on public.community_admin_public_profiles for insert to authenticated
with check (
  private.has_aal2()
  and user_id=auth.uid()
  and private.is_community_admin(community_id,auth.uid())
);

drop policy if exists "admins update own public community profile" on public.community_admin_public_profiles;
create policy "admins update own public community profile"
on public.community_admin_public_profiles for update to authenticated
using (
  private.has_aal2()
  and user_id=auth.uid()
  and private.is_community_admin(community_id,auth.uid())
)
with check (
  private.has_aal2()
  and user_id=auth.uid()
  and private.is_community_admin(community_id,auth.uid())
);

-- Topluluk gönderilerinde AAL2 zorunlu.
drop policy if exists "community admins insert posts" on public.community_posts;
create policy "community admins insert posts"
on public.community_posts for insert to authenticated
with check (
  private.has_aal2()
  and author_id=auth.uid()
  and (private.is_platform_admin(auth.uid()) or private.is_community_admin(community_id,auth.uid()))
);

drop policy if exists "community admins update posts" on public.community_posts;
create policy "community admins update posts"
on public.community_posts for update to authenticated
using (
  private.has_aal2()
  and (private.is_platform_admin(auth.uid()) or private.is_community_admin(community_id,auth.uid()))
)
with check (
  private.has_aal2()
  and (private.is_platform_admin(auth.uid()) or private.is_community_admin(community_id,auth.uid()))
);

drop policy if exists "community admins delete posts" on public.community_posts;
create policy "community admins delete posts"
on public.community_posts for delete to authenticated
using (
  private.has_aal2()
  and (private.is_platform_admin(auth.uid()) or private.is_community_admin(community_id,auth.uid()))
);

-- Bir hesap saatte en fazla 20 topluluk gönderisi oluşturabilir.
create or replace function private.enforce_community_post_rate_limit()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_count integer;
begin
  if new.author_id is null then
    raise exception 'Gönderi yazarı gerekli.' using errcode='P0001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('community-post:'||new.author_id::text,0));
  select count(*) into v_count
    from public.community_posts
   where author_id=new.author_id
     and created_at >= now()-interval '1 hour';
  if v_count >= 20 then
    raise exception 'Saatlik gönderi sınırına ulaşıldı.' using errcode='P0001';
  end if;
  return new;
end $$;
revoke all on function private.enforce_community_post_rate_limit() from public,anon,authenticated;

drop trigger if exists trg_community_post_rate_limit on public.community_posts;
create trigger trg_community_post_rate_limit
before insert on public.community_posts
for each row execute function private.enforce_community_post_rate_limit();

-- Storage yazma işlemleri: MFA + UUID/UUID.ext path şeması.
drop policy if exists "community post images insert by admins" on storage.objects;
drop policy if exists "community post images update by admins" on storage.objects;
drop policy if exists "community post images delete by admins" on storage.objects;

create policy "community post images insert by admins"
on storage.objects for insert to authenticated
with check (
  bucket_id='community-posts'
  and private.has_aal2()
  and name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|png)$'
  and private.storage_path_community_id(name) is not null
  and (
    private.is_platform_admin(auth.uid())
    or private.is_community_admin(private.storage_path_community_id(name),auth.uid())
  )
);

create policy "community post images update by admins"
on storage.objects for update to authenticated
using (
  bucket_id='community-posts'
  and private.has_aal2()
  and name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|png)$'
  and (
    private.is_platform_admin(auth.uid())
    or private.is_community_admin(private.storage_path_community_id(name),auth.uid())
  )
)
with check (
  bucket_id='community-posts'
  and private.has_aal2()
  and name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|png)$'
  and (
    private.is_platform_admin(auth.uid())
    or private.is_community_admin(private.storage_path_community_id(name),auth.uid())
  )
);

create policy "community post images delete by admins"
on storage.objects for delete to authenticated
using (
  bucket_id='community-posts'
  and private.has_aal2()
  and name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|png)$'
  and (
    private.is_platform_admin(auth.uid())
    or private.is_community_admin(private.storage_path_community_id(name),auth.uid())
  )
);

-- Bucket ayarını tekrar güvenli varsayılana sabitle.
update storage.buckets
set file_size_limit=5242880,
    allowed_mime_types=array['image/jpeg','image/png','image/webp']
where id='community-posts';
