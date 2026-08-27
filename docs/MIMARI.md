# NevGenç Teknik Mimarisi

## 1. Genel yapı

NevGenç mobil öncelikli statik web istemcisi ile Supabase servislerinden oluşur.

```text
Tarayıcı / Serdivan Cepte WebView
        |
        v
HTML + CSS + Vanilla JS
        |
        +--> Repository katmanı
        |       |
        |       +--> Supabase PostgreSQL + RLS
        |       +--> doğrulanmış yerel fallback veri
        |
        +--> Supabase Auth / hedef SSO
        +--> Supabase Storage
        +--> Edge Functions
        +--> Leaflet + OpenStreetMap
```

## 2. Ana navigasyon

- Etkinlikler
- Topluluklar
- Nev+
- Fırsatlar
- Harita

Profil ve yönetim paneli üst kullanıcı alanından açılır.

Eski `#/kesfet` rotası geriye uyumluluk için Nev+ ekranına yönlendirilir.

## 3. Nev+

Nev+ günlük servislerin ana modül katmanıdır. Modüllerin rotaları birbirinden bağımsız tutulur; böylece ileride her servis kendi veri kaynağına bağlanabilir.

Aktif:

- Oyun Odası
- Topluluk Haberleri
- Yemek Menüsü
- İş İlanları
- Kütüphane
- Öğrenci Dostu İşletmeler
- Serdivan Sosyal Tesisleri

Hazırlık:

- Kampüs Pazarı
- gerçek zamanlı kütüphane doluluk verisi
- doğrulanmış ürün/menü fiyat karşılaştırması

## 4. Veri erişim katmanı

`assets/js/services/repositories.js` ekranların doğrudan tablo ayrıntılarına bağlanmasını engeller.

Öncelik:

1. Supabase canlı veri
2. doğrulanmış yerel fallback
3. veri yoksa boş/çok yakında durumu

Yeni belediye tesisleri `municipal_facilities` tablosunda tutulur.

## 5. Kimlik ve SSO

Mevcut test akışı Supabase Auth e-posta/parola doğrulamasıdır.

Hedef üretim akışı Serdivan Cepte oturumunu NevGenç’e taşıyan SSO’dur. OAuth/OIDC destekleniyorsa doğrudan kurumsal identity provider tercih edilir. Alternatif olarak kısa ömürlü tek kullanımlık authorization code kullanılmalıdır.

E-posta veya uzun ömürlü erişim tokenı URL query parametresinde taşınmaz.

## 6. Yetkilendirme

Global rol bilgisi ile kaynak ilişkisi ayrıdır.

- Normal kullanıcı
- Topluluk yöneticisi → `community_admins`
- Kurum editörü → `organization_editors`
- Platform yöneticisi → `platform_admins`

Her toplulukta en fazla 4 yönetici, platformda en fazla 4 platform yöneticisi bulunur.

Kritik işlemler `content-admin` ve `role-admin` Edge Functions üzerinden yürütülür. RLS veritabanı seviyesinde ikinci güvenlik katmanıdır.

## 7. Topluluk içerikleri

Topluluk yöneticileri:

- metin
- görsel
- metin + görsel

paylaşabilir.

Kamuya açık görünüm `community_posts_public` ve `community_admins_public` görünümleri üzerinden, hassas kimlik alanları dışarı çıkarılmadan sağlanır.

Topluluk haberleri Nev+ içinde tüm topluluk gönderilerini kronolojik olarak birleştirir.

## 8. Harita

Leaflet + OpenStreetMap kullanılır.

Mevcut katmanlar:

- kampüs
- kütüphane
- yemekhane
- anlaşmalı işletme
- otobüs durakları / hatları

Doğrulanmamış koordinat haritaya tahmini pin olarak eklenmez.

## 9. Güvenlik sınırı

Frontend güvenilir yetki kaynağı değildir. Kullanıcının butonu görmemesi güvenlik kontrolü sayılmaz.

Yetki kontrolleri:

- Auth oturumu
- RLS
- Edge Function yetki kontrolü
- Storage politikaları

üzerinden uygulanır.

## 10. Sürüm yönetimi

Veritabanı değişiklikleri migration olarak eklenir; daha önce uygulanmış migration dosyaları mümkün olduğunca değiştirilmez.

v14 ile gelen migration:

```text
011_nevplus_ve_isletme_duzeltmeleri.sql
```

Bu migration British Town işletme adını düzeltir ve `municipal_facilities` veri modelini ekler.
