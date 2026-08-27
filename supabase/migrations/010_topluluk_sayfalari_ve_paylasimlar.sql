-- NevGenç v13 — Topluluk sayfaları, yönetici kartları ve topluluk gönderileri
-- Bu migration üretim ortamında 008_guvenli_auth_roller.sql sonrasında çalıştırılmalıdır.
-- Güvenlik ilkeleri:
--  * Auth e-postaları hiçbir public tabloda otomatik olarak yayımlanmaz.
--  * Public iletişim e-postası kullanıcı tarafından ayrıca ve açıkça girilir.
--  * Topluluk gönderisi yazma/silme yetkisi RLS ile veritabanı seviyesinde doğrulanır.
--  * Görsel yüklemeleri yalnızca ilgili topluluk yöneticilerine açıktır.

create extension if not exists pgcrypto;
create schema if not exists private;

-- -----------------------------------------------------------------------------
-- 1) Topluluk yöneticilerinin KAMUYA AÇIK profil kartları
-- Login e-postası bu tabloda tutulmaz. public_email yalnızca yönetici isterse girilir.
-- -----------------------------------------------------------------------------
create table if not exists public.community_admin_public_profiles (
  community_id uuid not null,
  user_id uuid not null,
  display_name text not null check (char_length(display_name) between 2 and 80),
  role_title text not null default 'Topluluk Yöneticisi' check (char_length(role_title) between 2 and 80),
  public_email text check (
    public_email is null or (
      char_length(public_email) <= 160
      and public_email = lower(public_email)
      and public_email ~ '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}$'
    )
  ),
  avatar_url text,
  sort_order smallint not null default 50 check (sort_order between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (community_id,user_id),
  foreign key (community_id,user_id)
    references public.community_admins(community_id,user_id)
    on delete cascade
);
create index if not exists community_admin_public_profiles_sort_idx
  on public.community_admin_public_profiles(community_id,sort_order,display_name);

-- Yeni yönetici atandığında yalnızca adı public karta alınır; e-posta ASLA otomatik açılmaz.
create or replace function private.bootstrap_community_admin_public_profile()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare v_name text;
begin
  select nullif(trim(p.full_name),'') into v_name
  from public.profiles p where p.id=new.user_id;

  insert into public.community_admin_public_profiles(
    community_id,user_id,display_name,role_title,public_email,sort_order
  ) values (
    new.community_id,new.user_id,coalesce(v_name,'Topluluk Yöneticisi'),'Topluluk Yöneticisi',null,50
  )
  on conflict (community_id,user_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_bootstrap_community_admin_public_profile on public.community_admins;
create trigger trg_bootstrap_community_admin_public_profile
after insert on public.community_admins
for each row execute function private.bootstrap_community_admin_public_profile();

-- Daha önce atanmış yöneticiler için güvenli başlangıç kartı.
insert into public.community_admin_public_profiles(community_id,user_id,display_name,role_title,public_email,sort_order)
select ca.community_id,ca.user_id,coalesce(nullif(trim(p.full_name),''),'Topluluk Yöneticisi'),'Topluluk Yöneticisi',null,50
from public.community_admins ca
left join public.profiles p on p.id=ca.user_id
on conflict (community_id,user_id) do nothing;

-- -----------------------------------------------------------------------------
-- 2) Topluluk gönderileri
-- Gönderiler en yeniden eskiye public okunur. Yazma yalnız ilgili yöneticilere açıktır.
-- -----------------------------------------------------------------------------
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text check (body is null or char_length(body) <= 5000),
  image_path text check (
    image_path is null or image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
  ),
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nullif(trim(coalesce(body,'')),'') is not null or image_path is not null)
);
create index if not exists community_posts_feed_idx
  on public.community_posts(community_id,is_published,published_at desc);
create index if not exists community_posts_author_idx
  on public.community_posts(author_id,created_at desc);

-- author_id istemciden farklı yazılamaz ve topluluk yetkisi mutlaka doğrulanır.
create or replace function private.validate_community_post_write()
returns trigger
language plpgsql security definer set search_path=''
as $$
begin
  if auth.uid() is null then raise exception 'Oturum gerekli.'; end if;
  if new.author_id <> auth.uid() and not private.is_platform_admin(auth.uid()) then
    raise exception 'Başka kullanıcı adına gönderi oluşturamazsın.';
  end if;
  if not private.is_platform_admin(auth.uid())
     and not private.is_community_admin(new.community_id,auth.uid()) then
    raise exception 'Bu topluluk adına paylaşım yetkin yok.';
  end if;
  new.body := nullif(trim(new.body),'');
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_validate_community_post_write on public.community_posts;
create trigger trg_validate_community_post_write
before insert or update on public.community_posts
for each row execute function private.validate_community_post_write();

-- -----------------------------------------------------------------------------
-- 3) İletişim: yalnız e-posta
-- organizations tablosuna da isteğe bağlı kurumsal iletişim e-postası eklenir.
-- -----------------------------------------------------------------------------
alter table public.organizations add column if not exists contact_email text;
alter table public.organizations drop constraint if exists organizations_contact_email_check;
alter table public.organizations add constraint organizations_contact_email_check check (
  contact_email is null or (
    char_length(contact_email) <= 160
    and contact_email = lower(contact_email)
    and contact_email ~ '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}$'
  )
);

update public.communities
set contact_email=lower(trim(contact_email))
where contact_email is not null;
update public.communities
set contact_email=null
where contact_email is not null
  and contact_email !~ '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}$';

alter table public.communities drop constraint if exists communities_contact_email_v13_check;
alter table public.communities add constraint communities_contact_email_v13_check check (
  contact_email is null or (
    char_length(contact_email) <= 160
    and contact_email = lower(contact_email)
    and contact_email ~ '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}$'
  )
);

-- -----------------------------------------------------------------------------
-- 4) Storage — topluluk gönderi görselleri
-- Max 5 MB, yalnız JPEG/PNG/WEBP. Bucket public-read, fakat yazma RLS ile kısıtlı.
-- -----------------------------------------------------------------------------
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'community-posts','community-posts',true,5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public=true,
  file_size_limit=5242880,
  allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create or replace function private.storage_path_community_id(p_name text)
returns uuid
language plpgsql immutable security definer set search_path=''
as $$
declare v text;
begin
  v := split_part(coalesce(p_name,''),'/',1);
  if v ~ '^[0-9a-fA-F-]{36}$' then return v::uuid; end if;
  return null;
exception when others then return null;
end $$;

-- Mevcut politika isimleri varsa temizle.
drop policy if exists "community post images insert by admins" on storage.objects;
drop policy if exists "community post images update by admins" on storage.objects;
drop policy if exists "community post images delete by admins" on storage.objects;

create policy "community post images insert by admins"
on storage.objects for insert to authenticated
with check (
  bucket_id='community-posts'
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
  and (
    private.is_platform_admin(auth.uid())
    or private.is_community_admin(private.storage_path_community_id(name),auth.uid())
  )
)
with check (
  bucket_id='community-posts'
  and (
    private.is_platform_admin(auth.uid())
    or private.is_community_admin(private.storage_path_community_id(name),auth.uid())
  )
);

create policy "community post images delete by admins"
on storage.objects for delete to authenticated
using (
  bucket_id='community-posts'
  and (
    private.is_platform_admin(auth.uid())
    or private.is_community_admin(private.storage_path_community_id(name),auth.uid())
  )
);

-- -----------------------------------------------------------------------------
-- 5) RLS / grants
-- -----------------------------------------------------------------------------
alter table public.community_admin_public_profiles enable row level security;
alter table public.community_posts enable row level security;

revoke insert,update,delete on public.community_admin_public_profiles from anon;
revoke insert,update,delete on public.community_posts from anon;
grant select on public.community_admin_public_profiles,public.community_posts to anon,authenticated;
grant insert,update,delete on public.community_admin_public_profiles,public.community_posts to authenticated;

-- Public yönetici kartları yalnız açıkça public amaçlı alanlardan oluşur.
drop policy if exists "public read community admin profiles" on public.community_admin_public_profiles;
create policy "public read community admin profiles"
on public.community_admin_public_profiles for select to anon,authenticated
using (true);

-- Yönetici yalnızca KENDİ public kartını, yönettiği topluluk için düzenleyebilir.
drop policy if exists "admins insert own public community profile" on public.community_admin_public_profiles;
create policy "admins insert own public community profile"
on public.community_admin_public_profiles for insert to authenticated
with check (
  user_id=auth.uid()
  and private.is_community_admin(community_id,auth.uid())
);

drop policy if exists "admins update own public community profile" on public.community_admin_public_profiles;
create policy "admins update own public community profile"
on public.community_admin_public_profiles for update to authenticated
using (
  user_id=auth.uid()
  and private.is_community_admin(community_id,auth.uid())
)
with check (
  user_id=auth.uid()
  and private.is_community_admin(community_id,auth.uid())
);

-- Gönderiler public okunur; yazma ilgili topluluk yöneticisi veya platform admin.
drop policy if exists "public read published community posts" on public.community_posts;
create policy "public read published community posts"
on public.community_posts for select to anon,authenticated
using (is_published=true);

drop policy if exists "community admins insert posts" on public.community_posts;
create policy "community admins insert posts"
on public.community_posts for insert to authenticated
with check (
  author_id=auth.uid()
  and (private.is_platform_admin(auth.uid()) or private.is_community_admin(community_id,auth.uid()))
);

drop policy if exists "community admins update posts" on public.community_posts;
create policy "community admins update posts"
on public.community_posts for update to authenticated
using (private.is_platform_admin(auth.uid()) or private.is_community_admin(community_id,auth.uid()))
with check (private.is_platform_admin(auth.uid()) or private.is_community_admin(community_id,auth.uid()));

drop policy if exists "community admins delete posts" on public.community_posts;
create policy "community admins delete posts"
on public.community_posts for delete to authenticated
using (private.is_platform_admin(auth.uid()) or private.is_community_admin(community_id,auth.uid()));

-- Public kurum bilgisi okunmaya devam eder; contact_email de bu profile dahildir.
grant select on public.organizations to anon,authenticated;

-- Hassas tabloların Auth e-postaları hâlâ public değildir.
-- community_admins SELECT politikaları 008 migration'daki kapsamla aynen korunur.

-- -----------------------------------------------------------------------------
-- 6) Public API yüzeyini daralt: auth UUID'leri anonim istemciye verilmez.
-- -----------------------------------------------------------------------------
revoke select on public.community_admin_public_profiles,public.community_posts from anon;

-- Ham tabloları normal authenticated kullanıcı da topluca okuyamaz; yalnız ilgili yetkili okur.
drop policy if exists "public read community admin profiles" on public.community_admin_public_profiles;
create policy "relevant admins read raw community admin profiles"
on public.community_admin_public_profiles for select to authenticated
using (
  user_id=auth.uid()
  or private.is_platform_admin(auth.uid())
  or private.is_community_admin(community_id,auth.uid())
);

drop policy if exists "public read published community posts" on public.community_posts;
create policy "admins read raw community posts"
on public.community_posts for select to authenticated
using (
  private.is_platform_admin(auth.uid())
  or private.is_community_admin(community_id,auth.uid())
);

-- Kamuya açık yöneticiler görünümü: user_id/login e-postası YOK.
create or replace view public.community_admins_public
with (security_barrier=true)
as
select
  ap.community_id,
  ap.display_name,
  ap.role_title,
  ap.public_email,
  ap.avatar_url,
  ap.sort_order
from public.community_admin_public_profiles ap
join public.communities c on c.id=ap.community_id
where c.is_active=true;

-- Kamuya açık gönderi görünümü: author_id YOK; yalnız yayımdaki içerik.
create or replace view public.community_posts_public
with (security_barrier=true)
as
select
  p.id,
  p.community_id,
  p.body,
  p.image_path,
  p.published_at,
  coalesce(ap.display_name,'Topluluk Yönetimi') as author_name,
  coalesce(ap.role_title,'Yönetici') as author_role
from public.community_posts p
join public.communities c on c.id=p.community_id and c.is_active=true
left join public.community_admin_public_profiles ap
  on ap.community_id=p.community_id and ap.user_id=p.author_id
where p.is_published=true;

revoke all on public.community_admins_public,public.community_posts_public from public;
grant select on public.community_admins_public,public.community_posts_public to anon,authenticated;

revoke all on function private.storage_path_community_id(text) from public;
grant execute on function private.storage_path_community_id(text) to authenticated;
revoke all on function private.bootstrap_community_admin_public_profile() from public;
