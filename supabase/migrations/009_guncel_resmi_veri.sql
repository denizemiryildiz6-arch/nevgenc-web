-- NevGenç başlangıç canlı verisi — 27 Ağustos 2026 tarihinde resmî kaynaklardan doğrulanan kayıtlar.
-- Amaç: sistem ilk açıldığında sahte/demo içerik göstermemek.
-- Sonraki içerikler üniversite/belediye/topluluk yetkili hesapları üzerinden yönetilir.

-- Veri kaynaklarının doğrulanma kaydı
create table if not exists public.source_registry (
  slug text primary key,
  label text not null,
  content_type text not null,
  url text not null check (url ~ '^https://[^[:space:]]+$'),
  last_verified_at timestamptz not null,
  is_active boolean not null default true
);
alter table public.source_registry enable row level security;
drop policy if exists "public read source registry" on public.source_registry;
create policy "public read source registry" on public.source_registry for select to anon,authenticated using(is_active=true);
grant select on public.source_registry to anon,authenticated;
revoke insert,update,delete on public.source_registry from anon,authenticated;

insert into public.source_registry(slug,label,content_type,url,last_verified_at) values
  ('sau-haber','Sakarya Üniversitesi Haber','announcement','https://haber.sakarya.edu.tr/','2026-08-27T21:00:00+03:00'),
  ('sau-ogrenci-isleri','SAÜ Öğrenci İşleri','announcement','https://ogrisl.sakarya.edu.tr/tr/duyuru/goruntule/liste/29336','2026-08-27T21:00:00+03:00'),
  ('sau-etkinlik','SAÜ Etkinlik Takvimi','event','https://etkinlik.sakarya.edu.tr/','2026-08-27T21:00:00+03:00'),
  ('sau-yemek','SAÜ SABİS Yemek Menüsü','dining','https://menu.sabis.sakarya.edu.tr/','2026-08-27T21:00:00+03:00'),
  ('sau-topluluk','SAÜ Öğrenci Toplulukları','community','https://topluluk.sakarya.edu.tr/','2026-08-27T21:00:00+03:00'),
  ('serdivan-haber','Serdivan Belediyesi Haberler','announcement','https://serdivan.bel.tr/haberler','2026-08-27T21:00:00+03:00'),
  ('sakus','Sakarya Büyükşehir SAKUS','transport','https://sakus.sakarya.bel.tr/harita','2026-08-27T21:00:00+03:00')
on conflict(slug) do update set
  label=excluded.label,content_type=excluded.content_type,url=excluded.url,last_verified_at=excluded.last_verified_at,is_active=true;

-- Kurum kimlikleri
with sau as (select id from public.organizations where slug='sakarya-universitesi')
insert into public.announcements(
  slug,kind,source_type,source_name,organization_id,title,summary,published_at,
  is_event,is_pinned,deadline_text,url,source_url,verified_at,is_published
)
select
  'sau-yks-kayit-kilavuzu-2026','Duyuru','university','Sakarya Üniversitesi',sau.id,
  '2026-2027 YKS Kayıt Kılavuzu yayımlandı',
  'Sakarya Üniversitesine yeni yerleşen öğrenciler için 2026-2027 kayıt sürecine ilişkin kılavuz yayımlandı.',
  '2026-08-21T09:00:00+03:00',false,true,null,
  'https://haber.sakarya.edu.tr/sakarya-niversitesi-2026-2027-yks-kayt-klavuzu-yaymland',
  'https://haber.sakarya.edu.tr/sakarya-niversitesi-2026-2027-yks-kayt-klavuzu-yaymland',
  '2026-08-27T21:00:00+03:00',true
from sau
on conflict(slug) do update set
  kind=excluded.kind,source_type=excluded.source_type,source_name=excluded.source_name,organization_id=excluded.organization_id,
  title=excluded.title,summary=excluded.summary,published_at=excluded.published_at,is_event=excluded.is_event,
  is_pinned=excluded.is_pinned,deadline_text=excluded.deadline_text,url=excluded.url,source_url=excluded.source_url,
  verified_at=excluded.verified_at,is_published=true;

with sau as (select id from public.organizations where slug='sakarya-universitesi')
insert into public.announcements(
  slug,kind,source_type,source_name,organization_id,title,summary,published_at,
  is_event,is_pinned,deadline_text,url,source_url,verified_at,is_published
)
select
  'sau-ogrenci-affi-2026','Duyuru','university','Sakarya Üniversitesi',sau.id,
  '7592 sayılı Kanun kapsamında öğrenci affı başvuruları',
  'Öğrenci affına ilişkin başvuru koşulları ve süreç bilgileri Sakarya Üniversitesi Öğrenci İşleri tarafından yayımlandı.',
  '2026-08-20T10:31:00+03:00',false,true,'Son başvuru: 9 Aralık 2026',
  'https://ogrisl.sakarya.edu.tr/tr/duyuru/goruntule/liste/29336',
  'https://ogrisl.sakarya.edu.tr/tr/duyuru/goruntule/liste/29336',
  '2026-08-27T21:00:00+03:00',true
from sau
on conflict(slug) do update set
  kind=excluded.kind,source_type=excluded.source_type,source_name=excluded.source_name,organization_id=excluded.organization_id,
  title=excluded.title,summary=excluded.summary,published_at=excluded.published_at,is_event=excluded.is_event,
  is_pinned=excluded.is_pinned,deadline_text=excluded.deadline_text,url=excluded.url,source_url=excluded.source_url,
  verified_at=excluded.verified_at,is_published=true;

with sau as (select id from public.organizations where slug='sakarya-universitesi')
insert into public.announcements(
  slug,kind,source_type,source_name,organization_id,title,summary,published_at,
  is_event,is_pinned,url,source_url,verified_at,is_published
)
select
  'sau-uluslararasi-hafta-2026','Haber','university','Sakarya Üniversitesi',sau.id,
  'SAÜ’de Uluslararası Hafta başladı',
  'Sakarya Üniversitesinin güncel haber akışında 25 Ağustos 2026 tarihinde yayımlanan Uluslararası Hafta haberi.',
  '2026-08-25T09:00:00+03:00',false,false,
  'https://haber.sakarya.edu.tr/','https://haber.sakarya.edu.tr/','2026-08-27T21:00:00+03:00',true
from sau
on conflict(slug) do update set
  source_name=excluded.source_name,organization_id=excluded.organization_id,title=excluded.title,summary=excluded.summary,
  published_at=excluded.published_at,url=excluded.url,source_url=excluded.source_url,verified_at=excluded.verified_at,is_published=true;

with sb as (select id from public.organizations where slug='serdivan-belediyesi')
insert into public.announcements(
  slug,kind,source_type,source_name,organization_id,title,summary,published_at,
  event_range_text,is_event,is_pinned,url,source_url,verified_at,is_published
)
select
  'serdivan-cocuk-bahcesi-3-hafta-2026','Etkinlik','municipality','Serdivan Belediyesi',sb.id,
  'Çocuk Bahçesi etkinlikleri 3. hafta atölyeleriyle devam ediyor',
  'Serdivan Belediyesi Kültür, Sanat ve Sosyal İşler Müdürlüğünün 3-14 yaş grubuna yönelik atölyeleri saat 19.30’da gerçekleştiriliyor.',
  '2026-08-19T09:00:00+03:00','Ağustos 2026',true,true,
  'https://serdivan.bel.tr/haberler/serdivan-da-cocuk-bahcesi-etkinlikleri-3-hafta-atoelyeleriyle-devam-ediyor',
  'https://serdivan.bel.tr/haberler/serdivan-da-cocuk-bahcesi-etkinlikleri-3-hafta-atoelyeleriyle-devam-ediyor',
  '2026-08-27T21:00:00+03:00',true
from sb
on conflict(slug) do update set
  source_name=excluded.source_name,organization_id=excluded.organization_id,title=excluded.title,summary=excluded.summary,
  published_at=excluded.published_at,event_range_text=excluded.event_range_text,is_event=true,is_pinned=true,
  url=excluded.url,source_url=excluded.source_url,verified_at=excluded.verified_at,is_published=true;

-- Güncel fırsatlar (resmî SAÜ haber kanalı)
insert into public.opportunities(
  slug,type,title,summary,organization,url,published_at,source_name,source_url,verified_at,is_published
) values
  ('sau-ihracat-akademisi-duzce-2026','Eğitim','İhracat Akademisi Düzce Eğitim Programı',
   'Sakarya Üniversitesi haber kanalında yayımlanan güncel eğitim programı.','Sakarya Üniversitesi',
   'https://haber.sakarya.edu.tr/hracat-akademisi-dzce-eitim-program','2026-08-25T09:00:00+03:00',
   'Sakarya Üniversitesi','https://haber.sakarya.edu.tr/hracat-akademisi-dzce-eitim-program','2026-08-27T21:00:00+03:00',true),
  ('sau-yapay-zeka-genclik-arastirmasi-2026','Araştırma','Yapay Zekâ ve Gençlik Araştırması',
   'Sakarya Üniversitesi tarafından 24 Ağustos 2026 tarihinde yayımlanan araştırma duyurusu.','Sakarya Üniversitesi',
   'https://haber.sakarya.edu.tr/yapay-zek-ve-genlik-aratrmas','2026-08-24T09:00:00+03:00',
   'Sakarya Üniversitesi','https://haber.sakarya.edu.tr/yapay-zek-ve-genlik-aratrmas','2026-08-27T21:00:00+03:00',true),
  ('sau-cambridge-linguaskill-2026','Eğitim','Cambridge Linguaskill Hazırlık Kursu',
   'Sakarya Üniversitesi haber kanalında yayımlanan Cambridge Linguaskill hazırlık kursu duyurusu.','Sakarya Üniversitesi',
   'https://haber.sakarya.edu.tr/cambridge-linguaskill-hazirlik-kursu','2026-08-24T09:00:00+03:00',
   'Sakarya Üniversitesi','https://haber.sakarya.edu.tr/cambridge-linguaskill-hazirlik-kursu','2026-08-27T21:00:00+03:00',true)
on conflict(slug) do update set
  type=excluded.type,title=excluded.title,summary=excluded.summary,organization=excluded.organization,url=excluded.url,
  published_at=excluded.published_at,source_name=excluded.source_name,source_url=excluded.source_url,
  verified_at=excluded.verified_at,is_published=true;

-- Yemekhane için doğrulanmamış öğün uydurulmaz. Uygulama, ilgili güne ait veritabanı kaydı
-- yoksa doğrudan resmî SABİS menüsüne yönlendirir.
