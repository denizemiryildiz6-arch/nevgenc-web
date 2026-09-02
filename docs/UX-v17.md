# NevGenç v17 — UX Standardı

- Mobil navigasyon ana ürün akışını bozmadan 44 px ve üzeri dokunma hedefleri kullanır.
- Klavye kullanıcıları için görünür focus state ve “Ana içeriğe geç” bağlantısı vardır.
- Modal pencereler odağı içeride tutar ve kapandığında odağı çağıran elemana geri verir.
- Parola alanlarında göster/gizle, Caps Lock uyarısı ve anlaşılır güç kontrolü vardır.
- İşlem yapan butonlar yükleme durumuna geçer; çift tıklama ve tekrarlı gönderim azaltılır.
- Kritik işlemler tarayıcı `confirm()` yerine ürün tasarımına uygun onay penceresinde gösterilir.
- Bağlantı kesildiğinde sayfa kaybolmaz; kullanıcıya canlı verinin güncellenmeyebileceği bildirilir.
- `prefers-reduced-motion` ve forced-colors erişilebilirlik tercihleri desteklenir.
- Yönetim panelinde MFA durumu görünür; yetkili kullanıcının neden işlem yapamadığı belirsiz 403 yerine anlaşılır güvenlik yönlendirmesiyle açıklanır.
- Görsel yükleme önizlemesi korunur, fakat yükleme öncesi görsel güvenli biçime dönüştürülür.

## Yönetici güvenlik UX'i

Platform yöneticisi panelindeki Güvenlik sekmesi MFA/AAL2 durumunu ve son yönetim denetim kayıtlarını tek ekranda sunar. Kritik rol ve silme işlemleri ikinci onay ister; işlemler sırasında butonlar yükleniyor durumuna geçerek tekrar tıklamayı engeller.
