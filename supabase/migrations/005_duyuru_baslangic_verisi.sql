-- 26 Ağustos 2026 tarihinde resmî kaynaklarla doğrulanan başlangıç duyuruları.

insert into public.announcements
(slug,kind,source_type,source_name,title,summary,published_at,is_event,is_pinned,deadline_text,url,source_url,verified_at,is_published)
values
(
  'sau-yks-kayit-kilavuzu-2026','Duyuru','university','Sakarya Üniversitesi',
  '2026-2027 YKS Kayıt Kılavuzu yayımlandı',
  'Sakarya Üniversitesine yeni yerleşen öğrenciler için kayıt tarihleri, gerekli belgeler ve SABİS üzerinden yürütülecek işlemler duyuruldu.',
  '2026-08-21 09:00:00+03',false,true,null,
  'https://haber.sakarya.edu.tr/sakarya-niversitesi-2026-2027-yks-kayt-klavuzu-yaymland',
  'https://haber.sakarya.edu.tr/sakarya-niversitesi-2026-2027-yks-kayt-klavuzu-yaymland',
  '2026-08-26',true
),
(
  'sau-ogrenci-affi-2026','Duyuru','university','Sakarya Üniversitesi',
  '7592 sayılı Kanun kapsamında öğrenci affı başvuruları',
  'Öğrenci affından yararlanmak isteyen adaylar için başvuru koşulları, gerekli belgeler ve son başvuru tarihi yayımlandı.',
  '2026-08-20 10:31:00+03',false,true,'Son başvuru: 9 Aralık 2026',
  'https://adabis.sakarya.edu.tr/Duyurular/Goruntule/858',
  'https://adabis.sakarya.edu.tr/Duyurular/Goruntule/858',
  '2026-08-26',true
),
(
  'serdivan-whatsapp-kanali-2026','Duyuru','municipality','Serdivan Belediyesi',
  'Serdivan Belediyesi resmî WhatsApp kanalı yayında',
  'Belediyenin duyuru, etkinlik ve hizmet bilgilerinin tek kanaldan takip edilebilmesi için resmî WhatsApp kanalı kullanıma açıldı.',
  null,false,false,null,
  'https://www.serdivan.bel.tr/haberler/serdivan-belediyesi-resmi-whats-app-kanalini-duyurdu-bilgiye-aninda-erisim',
  'https://www.serdivan.bel.tr/haberler/serdivan-belediyesi-resmi-whats-app-kanalini-duyurdu-bilgiye-aninda-erisim',
  '2026-08-26',true
),
(
  'serdivan-cocuk-bahcesi-agustos-2026','Etkinlik','municipality','Serdivan Belediyesi',
  'Serdivan Çocuk Bahçesi atölyeleri Ağustos boyunca devam ediyor',
  'Serdivan Belediyesi tarafından 3-14 yaş grubuna yönelik atölyeler ve aile seminerleri Ağustos ayı boyunca sürdürülüyor. Kayıtlar belediyenin çevrim içi başvuru sistemi üzerinden alınıyor.',
  '2026-08-04 10:00:00+03',true,false,null,
  'https://serdivan.bel.tr/haberler/serdivan-cocuk-bahcesi-atoelyeleri-basliyor-agustos-boyunca-egitim-ve-eglence-bir-arada',
  'https://serdivan.bel.tr/haberler/serdivan-cocuk-bahcesi-atoelyeleri-basliyor-agustos-boyunca-egitim-ve-eglence-bir-arada',
  '2026-08-26',true
)
on conflict (slug) do update set
  kind=excluded.kind,
  source_type=excluded.source_type,
  source_name=excluded.source_name,
  title=excluded.title,
  summary=excluded.summary,
  published_at=excluded.published_at,
  is_event=excluded.is_event,
  is_pinned=excluded.is_pinned,
  deadline_text=excluded.deadline_text,
  url=excluded.url,
  source_url=excluded.source_url,
  verified_at=excluded.verified_at,
  is_published=excluded.is_published,
  updated_at=now();

update public.announcements
set event_range_text='Ağustos 2026 boyunca'
where slug='serdivan-cocuk-bahcesi-agustos-2026';

insert into public.announcements
(slug,kind,source_type,source_name,community_id,title,summary,published_at,event_start,event_end,location,is_event,is_pinned,url,source_url,verified_at,is_published)
select
  'ybs-toplulugu-universite-tanitim-gunleri-2026','Topluluk','community','SAÜ Yönetim Bilişim Sistemleri Öğrenci Topluluğu',c.id,
  'Üniversite Tanıtım Günleri',
  'Yönetim Bilişim Sistemleri Öğrenci Topluluğu, üniversite ve bölüm tanıtımı amacıyla aday öğrencilerle buluştu ve tanıtım standı açtı.',
  '2026-08-11 09:30:00+03','2026-08-11 09:30:00+03','2026-08-12 16:30:00+03','Merkez Kafeterya',true,false,
  'https://topluluk.sabis.sakarya.edu.tr/Home/TumFaaliyetleriListele?page=2',
  'https://topluluk.sabis.sakarya.edu.tr/Home/TumFaaliyetleriListele?page=2',
  '2026-08-26',true
from public.communities c
where c.slug='sau-yonetim-bilisim-sistemleri-ogrenci-toplulugu'
on conflict (slug) do update set
  community_id=excluded.community_id,
  title=excluded.title,
  summary=excluded.summary,
  published_at=excluded.published_at,
  event_start=excluded.event_start,
  event_end=excluded.event_end,
  location=excluded.location,
  source_url=excluded.source_url,
  verified_at=excluded.verified_at,
  is_published=excluded.is_published,
  updated_at=now();
