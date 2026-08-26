NevGenç Mobil Harita Düzeltmesi

Bu paket, canlı repodaki dosyaların üzerine yazılacak küçük bir güncellemedir.
Supabase ayar dosyasını içermez; mevcut URL ve publishable key korunur.

GitHub repo köküne aynı klasör yapısıyla yükleyin:
- index.html
- assets/css/app.css
- assets/js/app.js
- assets/js/map.js
- assets/js/views.js
- assets/js/services/session.js

Mobil iyileştirmeler:
- Harita ekranında sayfanın yatay/dikey kayması engellendi.
- Harita mobilde ekranın kullanılabilir alanını tamamen doldurur.
- Filtreler haritanın üstünde yatay kaydırılabilir kompakt bir çubuk oldu.
- Otobüs hatları sadece Otobüsler filtresinde yatay şerit olarak görünür.
- Hat detayları alttan açılan, kaydırılabilir panelde gösterilir ve kapatılabilir.
- Harita sürüklenirken sayfanın kendisinin hareket etmesi engellendi.
- Mobil tarayıcı adres çubuğu/orientation değişimlerinde Leaflet boyutu yeniden hesaplanır.
- Tüm sitede istemsiz yatay taşma engellendi.

Not: config.js bu pakette yoktur; mevcut Supabase bağlantı bilgileri silinmez.
