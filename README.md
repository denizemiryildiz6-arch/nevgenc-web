# Serdivan NevGenç

NevGenç; üniversite öğrencilerinin etkinlik, topluluk, kampüs hizmeti, fırsat ve şehir içi öğrenci servislerine tek bir mobil öncelikli web arayüzünden erişmesini amaçlayan öğrenci platformudur.

Bu depo NevGenç’in kullanıcı arayüzünü, Supabase veritabanı şemasını, güvenlik politikalarını ve yönetim fonksiyonlarını içerir.

## Güncel ana navigasyon

Uygulamanın alt menüsü beş ana bölümden oluşur:

**Etkinlikler · Topluluklar · Nev+ · Fırsatlar · Harita**

Profil ve yetkili yönetim paneli sağ üstteki kullanıcı alanından açılır.

### Etkinlikler

- Üniversite, belediye ve öğrenci topluluklarından duyuru/etkinlik akışı
- Yaklaşan etkinlikler
- `Katılacağım` ve `İlgileniyorum` işlemleri
- Takip edilen toplulukların içeriklerinin öne çıkarılması

### Topluluklar

- SAÜ öğrenci toplulukları
- Arama ve kategori filtreleri
- Topluluk takip sistemi
- Topluluk detay sayfası
- Topluluk yöneticileri ve isteğe bağlı kamuya açık e-posta
- Topluluk gönderileri, metin ve görsel paylaşımı

### Nev+

Nev+ günlük öğrenci araçlarının toplandığı merkez sekmedir.

Aktif modüller:

- Oyun Odası
  - Sudoku
  - Balon Patlat
- Topluluk Haberleri
- Menüde Ne Var?
- İş İlanları
- Kütüphane / çalışma alanı randevusu
- En Ucuz Nerede Yerim? / Öğrenci Dostu İşletmeler
- Serdivan Sosyal Tesisleri

Hazırlanan ancak henüz canlı veri gereksinimleri tamamlanmayan modül:

- Kampüs Pazarı — `Çok yakında`

Canlı veri gerektiren alanlarda tahmini veya doğrulanmamış veri gösterilmez. Örneğin kütüphane doluluk oranı gerçek veri kaynağı sağlanmadan “canlı” olarak sunulmaz; öğrenci işletmelerinde fiyat karşılaştırması güncel fiyat verisi sağlandıktan sonra açılır.

### Fırsatlar

- İş ve staj ilanları
- Burs, yarışma, eğitim ve araştırma fırsatları
- Kaynak bağlantıları

### Harita

- SAÜ kampüs noktaları
- Kütüphane ve yemekhane
- NevGenç anlaşmalı işletmeleri
- Belediye otobüs hatları ve doğrulanmış duraklar
- Leaflet + OpenStreetMap altyapısı

## Anlaşmalı işletmeler

Mevcut başlangıç listesi:

1. Pandora Sakarya Güzellik Merkezi
2. British Town Yabancı Dil Okulu Sakarya
3. Reyhan Pasta Cafe

İndirim/avantaj oranı doğrulanmadıkça kullanıcıya oran gösterilmez.

## Serdivan sosyal tesis verileri

Nev+ içinde Serdivan Belediyesi resmî kaynakları esas alınarak aşağıdaki tesisler başlangıç verisine eklenmiştir:

- Gölpark
- Millet Bahçesi
- Kırantepe Sosyal Tesisleri
- Yıldız Kafe Çay Bahçesi
- Serdivan Çay Ocağı
- Şehit Mehmet Öztürk Kütüphanesi ve İnternet Evi
- Serdivan Kültür Sanat Kütüphanesi

Bu kayıtlar `municipal_facilities` tablosuna aktarılabilir ve Supabase üzerinden güncellenebilir.

## Teknoloji

Frontend:

- HTML5
- CSS3
- Vanilla JavaScript
- Leaflet.js
- OpenStreetMap

Backend / veri:

- Supabase PostgreSQL
- Supabase Auth
- Row Level Security (RLS)
- Supabase Storage
- Supabase Edge Functions

Yayın:

- GitHub Pages
- GitHub Actions veya `main / (root)` Pages yayını

Proje için zorunlu bir frontend build adımı yoktur.

## Kimlik doğrulama

### Mevcut test altyapısı

Depodaki mevcut kullanıcı girişi Supabase Auth üzerinden öğrenci e-posta adresi + parola + e-posta doğrulaması ile çalışacak şekilde hazırlanmıştır.

### Hedef üretim entegrasyonu

Belediye tarafındaki hedef akış, kullanıcının **Serdivan Cepte** hesabıyla NevGenç’e tekrar kayıt olmadan geçmesidir. Bilgi işlem birimiyle entegrasyon yöntemi kesinleştiğinde mevcut giriş ekranı SSO akışına dönüştürülecektir.

Tercih sırası:

1. OAuth 2.0 / OpenID Connect
2. Kısa ömürlü tek kullanımlık authorization code
3. Kurumsal imzalı JWT doğrulaması

Kullanıcı e-postası veya kalıcı erişim tokenı URL parametresinde taşınmamalıdır.

## Roller ve yetkiler

Temel roller:

- `user` — normal öğrenci
- topluluk yöneticisi — yalnız atandığı topluluk
- kurum editörü — belediye veya üniversite adına içerik
- `platform_admin` — merkez yönetim

Kurallar:

- Her toplulukta en fazla 4 aktif yönetici
- İlk topluluk yöneticisi platform yöneticisi tarafından atanır
- Sonraki yöneticiler mevcut topluluk yöneticileri tarafından eklenebilir
- En fazla 4 platform yöneticisi
- Giriş e-postası otomatik olarak kamuya açık iletişim bilgisi yapılmaz
- Topluluk ve yönetici iletişimi yalnız isteğe bağlı kamuya açık e-posta üzerinden yürütülür

Yetki kontrolü yalnız kullanıcı arayüzündeki butonlara bırakılmaz; veritabanı RLS politikaları ve Edge Functions ile sunucu tarafında doğrulanır.

## Yönetim paneli

Yetkili hesaplarda `#/yonetim` rotası üzerinden yönetim paneli açılır.

Panelde:

- topluluk gönderisi oluşturma
- metin veya görsel paylaşımı
- topluluk gönderilerini yayından kaldırma
- duyuru / etkinlik oluşturma
- topluluk açıklaması ve iletişim e-postası
- yönetici kartı bilgileri
- topluluk yöneticisi atama
- kurum editörü atama
- platform yöneticisi atama

işlemleri rol seviyesine göre gösterilir.

Topluluk gönderi görselleri Supabase Storage `community-posts` bucket’ında tutulur. JPG, PNG ve WEBP kabul edilir; frontend 5 MB sınırı uygular ve Storage politikaları yetkiyi topluluk bazında denetler.

## Proje dizin yapısı

```text
.
├── index.html
├── 404.html
├── README.md
├── assets/
│   ├── css/app.css
│   ├── img/
│   └── js/
│       ├── app.js
│       ├── config.js
│       ├── map.js
│       ├── views.js
│       ├── data/
│       │   ├── official-data.js
│       │   ├── announcements.js
│       │   ├── opportunities.js
│       │   ├── nevplus.js
│       │   └── seed.js
│       └── services/
│           ├── supabase.js
│           ├── session.js
│           └── repositories.js
├── supabase/
│   ├── migrations/
│   └── functions/
│       ├── content-admin/
│       ├── role-admin/
│       └── _shared/
└── docs/
```

## Supabase migration sırası

Yeni bir proje kurulurken migration dosyaları dosya adındaki sıra korunarak çalıştırılmalıdır:

```text
001_core.sql
002_seed_verified.sql
002b_transport_key_fix.sql
003_verified_public_data.sql
004_duyuru_ve_takip.sql
005_duyuru_baslangic_verisi.sql
006_harita_dogrulanmis_koordinatlar.sql
007_kutuphane_randevu_alanlari.sql
008_guvenli_auth_roller.sql
009_guncel_resmi_veri.sql
010_topluluk_sayfalari_ve_paylasimlar.sql
011_nevplus_ve_isletme_duzeltmeleri.sql
```

Daha önce 001–010 uygulanmış mevcut NevGenç veritabanında yalnızca yeni `011` migration’ı çalıştırılır.

## Edge Functions

Projede iki korumalı Edge Function bulunur:

```text
content-admin
role-admin
```

Deploy:

```bash
npx supabase@latest functions deploy content-admin --use-api
npx supabase@latest functions deploy role-admin --use-api
```

Canlı origin kısıtlaması için örnek:

```bash
npx supabase@latest secrets set ALLOWED_ORIGINS=https://ORNEK.github.io
```

`SUPABASE_SERVICE_ROLE_KEY` veya Supabase secret key frontend dosyalarına ya da GitHub reposuna yazılmamalıdır.

## Supabase bağlantısı

`assets/js/config.js`:

```js
NevGenc.config = {
  supabase: {
    url: 'https://PROJE.supabase.co',
    anonKey: 'PUBLISHABLE_KEY'
  }
}
```

Frontend’de yalnız publishable/anon anahtar kullanılır. Yetki güvenliği RLS ile sağlanır.

## Yerel çalıştırma

Windows:

```text
dev-server.bat
```

veya:

```bash
python -m http.server 5500
```

Tarayıcı:

```text
http://localhost:5500
```

`file://` üzerinden açmak yerine HTTP sunucusu kullanılması önerilir.

## GitHub Pages yayını

Repo kökünde `index.html` bulunmalıdır.

GitHub Pages için iki yöntem kullanılabilir:

- `Settings → Pages → Deploy from a branch → main → /(root)`
- depodaki GitHub Actions iş akışı

Hash routing kullanıldığı için rotalar `#/etkinlikler`, `#/topluluklar`, `#/nevplus` biçimindedir.

## Güvenlik notları

- `service_role` frontend’de kullanılmaz.
- RLS canlı tablolarda açık tutulmalıdır.
- Yönetici rolü yalnız UI üzerinden kontrol edilmez.
- Kullanıcıdan gelen metinler HTML escape işleminden geçirilir.
- Harici bağlantılar HTTPS ile sınırlandırılır.
- Topluluk görsel türü ve boyutu sınırlandırılır.
- Kişisel giriş e-postası kamuya açık yönetici iletişim alanına otomatik kopyalanmaz.
- Canlıya geçişten önce Auth/SSO, RLS, Edge Functions ve Storage politikaları staging ortamında yeniden test edilmelidir.

Detaylı güvenlik notları `docs/GUVENLIK-v14.md` ve teknik mimari `docs/MIMARI.md` dosyasındadır.

## Veri yaklaşımı

NevGenç’te doğrulanmayan canlı bilgi üretilmez. Veri kaynağı bulunmayan alanlar:

- `Çok yakında`
- resmî kaynağa yönlendirme
- mevcut doğrulanmış sabit bilgi

şeklinde ele alınır.

Bu prensip özellikle yemek menüsü, kütüphane doluluğu, işletme fiyatları, ulaşım koordinatları ve kampüs pazarı için geçerlidir.
