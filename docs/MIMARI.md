# NevGenç Teknik Mimarisi

## Genel yapı

NevGenç, mobil öncelikli ve statik olarak yayınlanabilen bir web uygulaması olarak tasarlanmıştır. Kullanıcı arayüzü HTML, CSS ve Vanilla JavaScript ile çalışır; veri ve kimlik doğrulama katmanı Supabase üzerinden sağlanır.

## Ana ekranlar

- Ana Sayfa
- Topluluklar
- Harita
- Fırsatlar
- Profil

Uygulama hash tabanlı istemci yönlendirmesi kullanır. Böylece GitHub Pages gibi statik barındırma servislerinde ilave sunucu yapılandırmasına ihtiyaç duyulmaz.

## Veri erişim katmanı

`assets/js/services/repositories.js`, ekranların doğrudan Supabase sorgusu yazmasını engelleyen ortak veri erişim katmanıdır.

İşleyiş:

1. Supabase yapılandırılmışsa ilgili tablo okunur.
2. Supabase bağlantısı yoksa projeye eklenmiş doğrulanmış açık veri seti kullanılır.
3. Veri ekranlara ortak bir biçimde aktarılır.

Bu yapı, arayüz ile veri kaynağının birbirinden ayrılmasını sağlar.

## Doğrulanmış açık veri

`assets/js/data/official-data.js` dosyası, resmî veya doğrulanmış kaynaklardan derlenen başlangıç verilerini içerir.

Bu dosyada kaynak adresi ve doğrulama tarihi tutulan alanlar bulunmaktadır.

## Harita

Harita altyapısı Leaflet.js ve OpenStreetMap kullanır.

Desteklenen konum türleri:

- campus
- library
- dining
- partner
- stop
- other

Toplu koordinat çözümleme tarayıcı üzerinden yapılmaz. Kampüs, kütüphane, yemekhane ve mevcut anlaşmalı işletmelerin doğrulanmış koordinatları yerel açık veri katmanında ve Supabase migration dosyasında sabitlenmiştir. Supabase'de eski bir kaydın koordinatı boş olsa bile repository katmanı doğrulanmış yerel koordinatı yedek olarak kullanır.

## Ulaşım

Ulaşım verisi üç ana tabloyla modellenmiştir:

- `transport_lines`
- `transport_stops`
- `transport_line_stops`

`transport_line_stops`, bir hattaki durakların sırasını ve yönünü saklar.

`transport_lines.route_geojson` alanı, doğrulanmış güzergâh geometrisinin haritada çizilmesi için ayrılmıştır.

## Kimlik doğrulama

Supabase Auth kullanılacak şekilde hazırlanmıştır.

Kullanıcı hesabı ile `profiles` tablosu aynı UUID üzerinden ilişkilidir.

`service_role` anahtarı frontend tarafında kullanılmaz.

## Güvenlik

Row Level Security (RLS) temel erişim politikaları `supabase/migrations/001_core.sql` içinde tanımlanmıştır.

Canlı kullanıma geçmeden önce kurumun kullanıcı rolleri ve yönetim süreçlerine göre politikaların tekrar gözden geçirilmesi önerilir.

## Duyuru ve etkileşim katmanı

NevGenç'in ana kullanım akışı duyuru merkezidir. `announcements` tablosu üniversite, belediye, topluluk ve NevGenç kaynaklı içerikleri ortak bir veri modelinde tutar.

Kullanıcı etkileşimleri iki ayrı tabloda saklanır:

- `community_follows`: kullanıcının takip ettiği topluluklar
- `announcement_responses`: kullanıcının bir duyuru/etkinlik için `interested` veya `attending` tercihi

Ana sayfadaki "Takip Ettiklerim" filtresi, bu iki katmanın topluluk ilişkisini kullanacak şekilde hazırlanmıştır. Kullanıcı oturumu yokken arayüz davranışının test edilebilmesi için aynı tercihler yerel depolamada saklanır; oturum açıldığında Supabase verisi esas alınır.

Harita ulaşım katmanında hat ve durak sırası resmî veri kaynağıyla gösterilir. Başlangıç veri setinde koordinatı ayrıca doğrulanmış bazı kampüs/Serdivan durakları doğrudan haritada işaretlenir. Bir hat seçildiğinde bu doğrulanmış noktalar ilgili hat üzerinde görünür, hattın tüm durakları panelde resmî sırasıyla listelenir. Tam güzergâh geometrisi (`route_geojson`) belediye veri kaynağından sağlandığında mevcut harita kodu rotayı otomatik olarak çizer. Koordinatı bulunmayan duraklara tahmini nokta verilmez.
