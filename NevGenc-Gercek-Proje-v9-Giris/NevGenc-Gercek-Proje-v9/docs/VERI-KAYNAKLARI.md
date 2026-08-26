# NevGenç Veri Kaynakları

Bu dosya, NevGenç platformunda kullanılan başlıca açık ve resmî veri kaynaklarını listeler.

## Sakarya Üniversitesi Öğrenci Toplulukları

Kaynak:  
https://topluluk.sakarya.edu.tr/

Kullanılan bilgiler:

- Topluluk adı
- Kategori
- Mevcut resmî sosyal medya bağlantıları

Doğrulanmış başlangıç veri setinde 206 topluluk bulunmaktadır.

## Sakarya Üniversitesi Merkez Kütüphanesi

Kaynak:  
https://kutuphane.sakarya.edu.tr/

Kullanılan bilgiler:

- Kütüphane adı
- Kapasite
- Alan bilgisi
- Adres
- Telefon
- E-posta
- Hizmet notları

## Sakarya Üniversitesi Yemek Menüsü

Kaynak:  
https://menu.sabis.sakarya.edu.tr/

Menü dinamik yayımlandığı için günlük yemek içerikleri sabit açık veri dosyasına eklenmez. Otomatik senkronizasyon için sunucu taraflı zamanlanmış görev önerilir.

## Sakarya Büyükşehir Belediyesi SAKUS

Kaynak:  
https://sakus.sakarya.bel.tr/harita

Kullanılan bilgiler:

- Kampüs bağlantılı belediye hatları
- Hat adları
- Durak adları
- Durak sıraları
- Kaynak bağlantıları

SAKUS, ulaşım kayıtlarında ana kaynak olarak kullanılır. Haritada nokta olarak gösterilen sınırlı sayıdaki başlangıç durağının koordinatları ayrıca açık harita/durak sayfalarıyla çapraz kontrol edilmiştir. Bu ayrım veritabanında `coordinate_source_url` alanıyla saklanabilir.

Projede kullanılan kampüs bağlantılı hatlar:

4, 6, 12, 15, 16K, 19K, 20, 20A, 21K, 22K, 24K, 26, 27, 29

## Anlaşmalı işletmeler

### Pandora Sakarya Güzellik Merkezi

Kaynak:  
https://pandorasakarya.com/

### British Way Yabancı Dil Kursu Sakarya

İşletme kaydı proje kapsamında doğrulanmıştır. Canlıya geçiş öncesi iletişim ve avantaj bilgilerinin yetkili kişi tarafından son kez kontrol edilmesi önerilir.

### Reyhan Pasta Cafe

Kaynak:  
https://www.reyhancihanpastacafe.com/

## Veri güncelleme kuralı

Sık değişebilecek bilgiler statik veri olarak uzun süre tutulmamalıdır.

Özellikle aşağıdaki alanlar periyodik olarak kontrol edilmelidir:

- işletme iletişim bilgileri,
- kampanya/indirim oranları,
- otobüs hat ve durak değişiklikleri,
- topluluk iletişim bilgileri,
- yemek menüsü,
- kütüphane çalışma saatleri.

Her mümkün kayıtta `source_url` ve `verified_at` alanlarının güncel tutulması önerilir.

## Duyuru akışı

Ana sayfadaki başlangıç duyuruları aşağıdaki resmî kaynaklardan doğrulanmıştır:

- Sakarya Üniversitesi Haber Merkezi: https://haber.sakarya.edu.tr/
- Sakarya Üniversitesi ADABİS duyuruları: https://adabis.sakarya.edu.tr/
- Sakarya Üniversitesi öğrenci topluluğu faaliyetleri: https://topluluk.sabis.sakarya.edu.tr/
- Serdivan Belediyesi haber ve etkinlikleri: https://www.serdivan.bel.tr/

Duyuru kayıtlarında kaynak URL'si ve doğrulama tarihi tutulur. İçeriklerin tamamını kopyalamak yerine başlık, kısa özet, tarih ve resmî kaynak bağlantısı saklanması tercih edilir.

## Ulaşım verisi kullanım notu

SAKUS hat ve durak verileri Sakarya Büyükşehir Belediyesinin resmî ulaşım kaynağına dayanmaktadır. Canlı API/JSON servislerinin üretim ortamında doğrudan kullanılması kurum içi veri paylaşım yöntemi ve kullanım koşulları doğrultusunda yapılmalıdır. Proje, belediye tarafından sağlanacak rota geometrisi ve durak koordinatlarını Supabase'e aktarabilecek veri alanlarını hazır olarak içerir.


## Harita koordinatları

Haritada doğrudan gösterilen temel konumların koordinatları sabitlenmiştir:

- Sakarya Üniversitesi Esentepe Kampüsü
- SAÜ Merkez Kütüphanesi
- Sakarya Üniversitesi Öğrenci Yemekhanesi
- Pandora Sakarya Güzellik Merkezi
- British Way Yabancı Dil Kursu Sakarya
- Reyhan Pasta Cafe

Kütüphane için OpenStreetMap tabanlı konum kaydı, yemekhane için işletme/kapı harita kaydı, işletmeler için resmî işletme sayfaları veya proje kapsamında doğrulanan harita kayıtları kullanılmıştır.

Ulaşım katmanında ilk doğrulanmış durak koordinatları arasında Kampüs, Kampüs -1, BESYO-1, Esentepe Giriş Kapısı, KYK-1, Üniversite Caddesi -1, Medar Hastanesi, Diş Hastanesi -1, Cadde 54, Serdivan Belediyesi ve Serdivan AVM -4 gibi noktalar bulunur. Tam durak listesi yine SAKUS sırasını esas alır. Koordinatı doğrulanmamış bir durağa tahmini nokta verilmez.

Harita verisi için ilgili migration:

`supabase/migrations/006_harita_dogrulanmis_koordinatlar.sql`
