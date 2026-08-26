# NevGenç Web Platformu

NevGenç; Sakarya’daki üniversite öğrencilerinin üniversite, belediye ve öğrenci topluluklarından gelen duyuruları tek akışta takip edebilmesi; toplulukları izleyebilmesi ve kampüs/şehir yaşamındaki temel hizmetlere erişebilmesi amacıyla geliştirilen web tabanlı bir öğrenci platformudur.

Platformun ana yapısı beş bölümden oluşur:

**Ana Sayfa · Topluluklar · Harita · Fırsatlar · Profil**

Proje mobil öncelikli hazırlanmıştır. Masaüstü tarayıcılarda da aynı veri yapısı ve işlevler korunur.

---

## 1. Projenin Amacı

NevGenç'in temel işlevi **duyuru ve katılım akışıdır**. Ana sayfa; Sakarya Üniversitesi, Serdivan Belediyesi ve öğrenci topluluklarının öğrenciyi ilgilendiren duyuru ve etkinliklerini bir araya getirir. Kullanıcılar toplulukları takip edebilir, etkinliklerde **Katılacağım / İlgileniyorum** tercihi bırakabilir ve takip ettikleri toplulukların içeriklerini ayrı filtreleyebilir.

Bunun yanında aşağıdaki bilgiler ve hizmetler tek arayüzde toplanır:

- Sakarya Üniversitesi, Serdivan Belediyesi ve topluluk duyuruları
- Sakarya Üniversitesi öğrenci toplulukları ve takip sistemi
- Kampüs ve Serdivan üzerindeki önemli noktalar
- Anlaşmalı işletmeler
- Belediye otobüs hatları ve durak bilgileri
- Sakarya Üniversitesi Merkez Kütüphanesi bilgileri ve çalışma alanı randevusu
- Sakarya Üniversitesi yemek menüsü
- Katılacağım etkinlikleri ve kütüphane randevularını birleştiren kişisel takvim
- Öğrencilere yönelik staj, burs, yarışma ve gönüllülük fırsatları
- Şifresiz isim girişi, kullanıcı profili ve ileride kullanılacak N Puan sistemi

Veri yapısı, doğrulanmış bilgilerin kaynağı ve son doğrulama tarihiyle birlikte saklanmasına uygun olarak hazırlanmıştır.

---

## 2. Mevcut Veri İçeriği

Projede 26 Ağustos 2026 tarihinde doğrulanan başlangıç veri seti bulunmaktadır.

### Öğrenci toplulukları

Sakarya Üniversitesi resmî Öğrenci Toplulukları kaynağından derlenen **206 topluluk** sisteme eklenmiştir.

Topluluklar dokuz ana kategoride sınıflandırılmıştır:

- Sosyal Bilimler
- Fen Bilimleri
- Fikir
- Uluslararası
- Spor
- Sosyal Sorumluluk
- Sağlık Bilimleri
- Teknoloji
- Kültür-Sanat

Resmî sosyal medya bağlantısı bulunan topluluklarda bu bağlantılar da veri setine eklenmiştir. Açıklama veya iletişim bilgisi doğrulanamayan alanlarda tahmini bilgi kullanılmamıştır.

### Anlaşmalı işletmeler

Mevcut anlaşmalı işletmeler:

1. Pandora Sakarya Güzellik Merkezi
2. British Way Yabancı Dil Kursu Sakarya
3. Reyhan Pasta Cafe

İndirim oranı veya kampanya şartı kesinleşmemiş işletmeler için sistemde oran bilgisi gösterilmez.

### Ulaşım

Kampüsle bağlantılı **14 belediye otobüs hattı** için veri yapısı ve durak sıraları hazırlanmıştır:

**4, 6, 12, 15, 16K, 19K, 20, 20A, 21K, 22K, 24K, 26, 27, 29**

Hat ve durak adları ile durak sıraları Sakarya Büyükşehir Belediyesi SAKUS kaynağı esas alınarak tutulmaktadır. Harita üzerinde başlangıç olarak koordinatı ayrıca doğrulanmış kampüs ve Serdivan durakları gösterilir. Bir hat seçildiğinde, o hatta ait koordinatı doğrulanmış duraklar haritada; hattın tüm durakları ise resmî sırasıyla bilgi panelinde gösterilir. Tam güzergâh geometrisi belediye veri kaynağından sağlandığında `route_geojson` alanına aktarılır ve mevcut harita bileşeni rotayı doğrudan çizer.

### Kütüphane

Sakarya Üniversitesi Merkez Kütüphanesi için doğrulanmış kapasite, alan, adres ve iletişim bilgileri bulunmaktadır.

### Yemekhane

Sakarya Üniversitesi SABİS yemek menüsü resmî veri kaynağı olarak tanımlanmıştır. Menü içeriği dinamik yayımlandığı için doğrulanmamış yemek adları sabit veri olarak eklenmemiştir. Günlük otomatik menü aktarımı Supabase tarafında zamanlanmış görev veya sunucu fonksiyonu ile tamamlanabilir.

---


## 3. Ana Sayfa ve Duyuru Akışı

Ana sayfa tanıtım ekranı olarak değil, günlük kullanım ekranı olarak tasarlanmıştır. Duyurular şu kaynak türleriyle ayrılır:

- Sakarya Üniversitesi
- Serdivan Belediyesi
- Öğrenci toplulukları
- NevGenç tarafından yayınlanan platform duyuruları

Kullanıcılar akışı **Tümü, Üniversite, Belediye, Topluluklar ve Takip Ettiklerim** filtreleriyle görüntüleyebilir.

Topluluk kartlarında bulunan **Takip Et** işlemi, ilgili topluluğun duyurularını kişiselleştirilmiş akışa dahil eder. Etkinlik niteliğindeki duyurularda **Katılacağım** ve tüm uygun duyurularda **İlgileniyorum** tercihleri kullanılabilir.

Bu sürümde kullanıcı ilk açılışta yalnızca **adını yazarak** giriş yapar; parola istenmez. Supabase üzerinde anonim oturum özelliği etkinse bu giriş arka planda benzersiz bir kullanıcı kimliğine bağlanır ve takip, duyuru tercihleri ile kütüphane randevuları RLS kuralları altında Supabase üzerinde saklanabilir. Anonim oturum kapalıysa sistem aynı işlemleri cihaz üzerinde yerel olarak sürdürür.

---

## 4. Kullanıcı Girişi

Mevcut sürümde giriş akışı özellikle basit tutulmuştur. Kullanıcı siteyi ilk açtığında yalnızca **Ad Soyad** alanını doldurur ve **Devam Et** düğmesine basar. Şifre, e-posta veya SMS doğrulaması istenmez.

Girilen ad cihazda saklanır ve Profil ekranında gösterilir. Supabase **Anonymous Sign-Ins** etkinleştirildiğinde aynı akış kullanıcıdan e-posta veya parola istemeden bir Supabase Auth kimliği oluşturur. Böylece kişisel takipler, etkinlik tercihleri ve kütüphane randevuları kullanıcı bazında saklanabilir. Yönetici yetkileri bu basit girişe bağlanmamalıdır.

---

## 5. Teknoloji Yapısı

Frontend tarafı mümkün olduğunca bağımlılığı düşük ve bakım yapılabilir olacak şekilde hazırlanmıştır.

- HTML5
- CSS3
- Vanilla JavaScript
- Leaflet.js
- OpenStreetMap
- Supabase
  - PostgreSQL
  - Auth
  - Row Level Security (RLS)
- GitHub Pages / GitHub Actions

Projede Node.js veya derleme adımı zorunlu değildir. Statik dosyalar doğrudan yayınlanabilir.

---

## 6. Proje Klasör Yapısı

```text
NevGenc/
│
├── index.html                 Ana uygulama dosyası
├── 404.html                   GitHub Pages hata/yönlendirme sayfası
├── README.md                  Proje açıklaması ve kurulum rehberi
├── dev-server.bat             Windows üzerinde yerel test başlatıcısı
│
├── assets/
│   ├── css/
│   │   └── app.css            Tüm arayüz stilleri
│   ├── img/                   Logo ve görsel dosyaları
│   └── js/
│       ├── app.js             Uygulama başlangıcı ve yönlendirme
│       ├── config.js          Supabase, harita ve veri kaynağı ayarları
│       ├── map.js             Leaflet harita işlemleri
│       ├── views.js           Ekran bileşenleri
│       ├── data/
│       │   ├── official-data.js  Doğrulanmış açık veri seti
│       │   ├── announcements.js  Doğrulanmış başlangıç duyuruları
│       │   └── seed.js           Yerel veri başlangıç katmanı
│       └── services/
│           ├── supabase.js       Supabase istemcisi
│           ├── session.js        Geçici şifresiz isim oturumu
│           └── repositories.js   Veri erişim katmanı
│
├── supabase/
│   └── migrations/            Veritabanı tablo, güvenlik ve veri aktarımları
│
├── docs/
│   ├── MIMARI.md              Teknik mimari
│   ├── VERI-KAYNAKLARI.md     Kullanılan resmî veri kaynakları
│   └── YAYINLAMA.md           GitHub Pages ve Supabase yayınlama adımları
│
└── .github/
    └── workflows/
        └── pages.yml           GitHub Pages otomatik yayın iş akışı
```

---

## 7. Yerel Ortamda Çalıştırma

Proje statik olduğu için `index.html` dosyası doğrudan açılabilir. Ancak harita, Supabase ve CDN kaynaklarının doğru çalışması için yerel HTTP sunucusu kullanılması önerilir.

### Windows

Proje kökündeki:

```text
dev-server.bat
```

dosyası çalıştırılabilir.

### Python ile

Proje klasöründe terminal açılarak:

```bash
python -m http.server 5500
```

komutu çalıştırılır.

Daha sonra tarayıcıdan:

```text
http://localhost:5500
```

adresine girilir.

---

## 8. Supabase Kurulumu

### 7.1. Yeni Supabase projesi oluşturma

Supabase üzerinde yeni bir proje oluşturulur.

### 7.2. SQL dosyalarını çalıştırma

Supabase Dashboard → **SQL Editor** bölümünde aşağıdaki dosyalar sırayla çalıştırılmalıdır:

```text
supabase/migrations/001_core.sql
supabase/migrations/002_seed_verified.sql
supabase/migrations/002b_transport_key_fix.sql
supabase/migrations/003_verified_public_data.sql
supabase/migrations/004_duyuru_ve_takip.sql
supabase/migrations/005_duyuru_baslangic_verisi.sql
supabase/migrations/006_harita_dogrulanmis_koordinatlar.sql
supabase/migrations/007_kutuphane_randevu_alanlari.sql
```

> Mevcut bir NevGenç Supabase veritabanı kullanılıyorsa tüm şemayı yeniden kurmak gerekmez. Harita düzeltmesi için en az `006_harita_dogrulanmis_koordinatlar.sql` dosyasının çalıştırılması gerekir. Frontend, bu migration uygulanmadan önce de yerel doğrulanmış koordinatları yedek olarak kullanır.

Bu dosyalar:

- temel tabloları,
- kullanıcı profili yapısını,
- RLS güvenlik politikalarını,
- topluluk verilerini,
- anlaşmalı işletmeleri,
- ulaşım hatlarını ve durak ilişkilerini,
- duyuru akışını,
- topluluk takiplerini,
- Katılacağım / İlgileniyorum kullanıcı tercihlerini,
- haritada kullanılan doğrulanmış kampüs, işletme ve ilk durak koordinatlarını

oluşturur.

### 7.3. Şifresiz kullanıcı oturumunu Supabase ile kalıcılaştırma

Supabase Dashboard → **Authentication → Providers / Sign In Methods** bölümünde **Anonymous Sign-Ins** etkinleştirilir. Bu ayar açık olduğunda kullanıcı yine yalnızca adını yazar; e-posta veya parola istenmez. Arka planda oluşturulan anonim kullanıcı kimliği RLS politikalarıyla kişisel verileri ayırır.

### 7.4. Bağlantı bilgilerini ekleme

Supabase Dashboard → **Project Settings → API** bölümünden:

- Project URL
- Public `anon` key

alınır.

`assets/js/config.js` dosyasındaki aşağıdaki alanlar doldurulur:

```js
supabase: {
  url: 'SUPABASE_PROJECT_URL',
  anonKey: 'SUPABASE_PUBLIC_ANON_KEY'
}
```

### Güvenlik uyarısı

`service_role` anahtarı hiçbir zaman frontend dosyalarına veya herkese açık GitHub deposuna eklenmemelidir.

Frontend üzerinde yalnızca Supabase’in public `anon` anahtarı kullanılmalıdır. Veri erişim yetkileri RLS politikalarıyla sınırlandırılır.

---

## 9. GitHub Üzerinden Yayınlama

Proje GitHub deposunun kök dizinine aktarılır.

Önerilen ana dal:

```text
main
```

Depoda bulunan:

```text
.github/workflows/pages.yml
```

GitHub Pages dağıtımını otomatik olarak gerçekleştirir.

GitHub üzerinde:

**Settings → Pages → Source → GitHub Actions**

seçilmelidir.

`main` dalına yapılan sonraki gönderimlerde site otomatik olarak yeniden yayımlanır.

Ayrıntılı bilgi için `docs/YAYINLAMA.md` dosyasına bakılabilir.

---

## 10. Harita Sistemi

Harita için **Leaflet.js + OpenStreetMap** kullanılmaktadır.

Harita veri modeli aşağıdaki türleri desteklemektedir:

- Kampüs noktaları
- Kütüphane
- Yemekhane
- Anlaşmalı işletmeler
- Otobüs durakları
- Belediye otobüs hatları
- Diğer öğrenci hizmet noktaları

Kampüs, Merkez Kütüphane, Öğrenci Yemekhanesi ve mevcut üç anlaşmalı işletmenin koordinatları proje veri setinde sabitlenmiştir. Bu temel noktalar tarayıcı tarafında adres çözümlemesine ihtiyaç duymadan doğrudan haritada açılır. Aynı koordinatlar `006_harita_dogrulanmis_koordinatlar.sql` dosyasıyla Supabase tarafına da aktarılır.

Ulaşım katmanında SAKUS'tan alınan tam durak sırası korunur. Koordinatı ayrıca doğrulanmış duraklar harita üzerinde gösterilir ve durak listesinden seçilebilir. Tam hat geometrileri belediyeden/kurum içi veri servisinden sağlandığında `transport_lines.route_geojson` alanına yazılması yeterlidir; arayüz bu geometriyi otomatik olarak çizer. Doğrulanmamış duraklara tahmini koordinat verilmez.

---

## 11. Veri Güncelleme İlkesi

Projede resmî kaynaklardan gelen bilgiler mümkün olduğunca kaynak URL’si ve doğrulama tarihiyle saklanmaktadır.

Sık değişen verilerin sabit olarak tutulmaması önerilir. Örnekler:

- günlük yemek menüsü,
- işletme çalışma saatleri,
- kampanya ve indirim oranları,
- topluluk yönetim bilgileri,
- otobüs güzergâh değişiklikleri,
- geçici fırsat ve etkinlikler.

Bu veriler için Supabase üzerinden yönetim ekranı veya zamanlanmış veri güncelleme mekanizması kullanılabilir.

Kullanılan açık veri kaynaklarının listesi `docs/VERI-KAYNAKLARI.md` dosyasındadır.

---

## 12. Güvenlik

Projede aşağıdaki temel güvenlik prensipleri uygulanmıştır:

- Supabase `service_role` anahtarı istemci tarafında kullanılmaz.
- Kullanıcıya özel veriler RLS politikalarıyla korunur.
- Mevcut şifresiz isim girişi yalnızca cihaz içi kişiselleştirme sağlar ve güvenli kimlik doğrulama olarak kabul edilmez.
- Supabase Auth etkinleştirildiğinde kullanıcı profil kaydı doğrulanmış Auth kullanıcısıyla ilişkilendirilir.
- Haricî bağlantılar yeni sekmede güvenli `rel="noopener"` özelliğiyle açılır.
- Kullanıcıya gösterilen dinamik metinlerde HTML kaçış işlemi uygulanır.
- `.env` dosyaları Git tarafından yok sayılır.

Kurumsal kullanıcı doğrulamasına geçildiğinde alan adı, CORS, Supabase Auth yönlendirme adresleri ve RLS politikalarının kurum ortamında ayrıca kontrol edilmesi önerilir.

---

## 13. Mevcut Durum ve Sonraki Aşamalar

Mevcut proje; duyuru odaklı ana kullanıcı arayüzünü, topluluk takiplerini, Katılacağım / İlgileniyorum tercihlerini, veri modelini, harita ve ulaşım altyapısını, doğrulanmış açık veri setini ve Supabase veritabanı yapısını içermektedir.

Canlı kullanım öncesinde tamamlanması önerilen başlıca çalışmalar:

1. Kuruma ait Supabase projesinin oluşturulması ve bağlantı bilgilerinin eklenmesi.
2. Mevcut ad tabanlı geçici girişin, gerekli görülürse e-posta/kurumsal hesap veya başka bir doğrulama yöntemiyle güçlendirilmesi.
3. Günlük SAÜ yemek menüsünün otomatik senkronizasyonunun kurulması.
4. Belediye tarafından sağlanacak doğrulanmış rota geometrileri ve durak koordinatlarının harita katmanına eklenmesi.
5. Anlaşmalı işletmelerin güncel avantaj/indirim bilgilerinin yönetim ekranından girilmesi.
6. Fırsat ve duyuru içerikleri için yetkili yönetim ekranının hazırlanması.
7. Kurumsal alan adı ve yayın ortamının belirlenmesi.

---

## 14. Veri Kaynakları

Başlıca kaynaklar:

- Sakarya Üniversitesi Öğrenci Toplulukları  
  https://topluluk.sakarya.edu.tr/
- Sakarya Üniversitesi Kütüphane ve Dokümantasyon Dairesi Başkanlığı  
  https://kutuphane.sakarya.edu.tr/
- Sakarya Üniversitesi SABİS Yemek Menüsü  
  https://menu.sabis.sakarya.edu.tr/
- Sakarya Büyükşehir Belediyesi SAKUS  
  https://sakus.sakarya.bel.tr/harita
- Sakarya Üniversitesi Haber / Duyuru kaynakları  
  https://haber.sakarya.edu.tr/  
  https://adabis.sakarya.edu.tr/
- Serdivan Belediyesi  
  https://www.serdivan.bel.tr/

Anlaşmalı işletme verilerinde işletmelerin kendi resmî kanalları ve proje kapsamında doğrulanan işletme kayıtları esas alınmıştır.

---

## 15. Teknik Not

Uygulama arayüzü hash tabanlı yönlendirme kullanır:

```text
#/anasayfa
#/topluluklar
#/harita
#/firsatlar
#/profil
```

Bu yöntem, statik GitHub Pages yayınında sunucu tarafı yönlendirme ihtiyacını ortadan kaldırır ve doğrudan dağıtımı kolaylaştırır.
