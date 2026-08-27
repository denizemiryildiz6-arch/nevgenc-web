-- NevGenç v14 / Nev+
-- 1) Anlaşmalı dil okulu adının resmî kaynağa göre düzeltilmesi
-- 2) Serdivan belediye tesislerinin yönetilebilir/veritabanı tabanlı tutulması

update public.partners
set
  name = 'British Town Yabancı Dil Okulu Sakarya',
  category = 'Yabancı Dil Okulu',
  description = 'NevGenç anlaşmalı yabancı dil okulu. Anlaşmaya ait öğrenci avantajı kesinleştiğinde ayrıca gösterilir.',
  address = 'Cumhuriyet Mahallesi, Telli Sokak No:3, Adapazarı / Sakarya',
  phone = '+90 264 777 35 55',
  website_url = 'https://britishtown.com.tr/sakarya-ingilizce-kursu/',
  source_name = 'British Town resmî Sakarya şubesi',
  source_url = 'https://britishtown.com.tr/sakarya-ingilizce-kursu/',
  verified_at = '2026-08-28'
where slug = 'british-way-sakarya';

create table if not exists public.municipal_facilities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  facility_type text not null,
  address text,
  latitude double precision,
  longitude double precision,
  source_url text not null,
  verified_at date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.municipal_facilities enable row level security;

drop policy if exists "public read active municipal facilities" on public.municipal_facilities;
create policy "public read active municipal facilities"
on public.municipal_facilities
for select
to anon, authenticated
using (is_active = true);

insert into public.municipal_facilities (slug,name,facility_type,address,source_url,verified_at,is_active) values
('golpark','Gölpark','Sosyal tesis / park','Esentepe Mahallesi, İstanbul Caddesi, Serdivan / Sakarya','https://serdivan.bel.tr/tesislerimiz','2026-08-28',true),
('millet-bahcesi','Millet Bahçesi','Millet bahçesi / kafeterya','Arabacıalanı Mahallesi, 559. Sokak üzeri yeşil alan, Serdivan / Sakarya','https://serdivan.bel.tr/tesislerimiz','2026-08-28',true),
('kirantepe-sosyal-tesisleri','Kırantepe Sosyal Tesisleri','Sosyal tesis','Kemalpaşa Mahallesi, 48. Sokak yeşil alan, Serdivan / Sakarya','https://serdivan.bel.tr/tesislerimiz','2026-08-28',true),
('yildiz-kafe-cay-bahcesi','Yıldız Kafe Çay Bahçesi','Kafe / çay bahçesi','Arabacıalanı Mahallesi, 530. Sokak üzeri yeşil alan, Serdivan / Sakarya','https://serdivan.bel.tr/tesislerimiz','2026-08-28',true),
('serdivan-cay-ocagi','Serdivan Çay Ocağı','Çay ocağı','İstiklal Mahallesi, Bağlar Caddesi Park Sokak, Karakol yanı, Serdivan / Sakarya','https://serdivan.bel.tr/tesislerimiz','2026-08-28',true),
('sehit-mehmet-ozturk-kutuphanesi','Şehit Mehmet Öztürk Kütüphanesi ve İnternet Evi','Kütüphane','Serdivan / Sakarya','https://serdivan.bel.tr/haberler/sehit-mehmet-oeztuerk-kuetuephanesi-cocuklara-oezel-atoelyeler','2026-08-28',true),
('serdivan-kultur-sanat-kutuphanesi','Serdivan Kültür Sanat Kütüphanesi','Kütüphane','Arabacıalanı Mahallesi, 541. Sokak No:14, Serdivan / Sakarya','https://serdivan.bel.tr/Serdivan%20Belediyesi%202026%20Performans%20Programi.pdf','2026-08-28',true)
on conflict (slug) do update set
  name=excluded.name,
  facility_type=excluded.facility_type,
  address=excluded.address,
  source_url=excluded.source_url,
  verified_at=excluded.verified_at,
  is_active=true,
  updated_at=now();
