# NevGenç v17 — Üretim Güvenliği

Bu sürüm güvenliği yalnız arayüzde buton gizlemek yerine Supabase Auth, AAL2, RLS, Storage politikaları, Edge Functions ve veritabanı kontrolleriyle birlikte uygular.

## Uygulanan kontroller

- Yönetici işlemlerinde TOTP MFA / AAL2. `REQUIRE_ADMIN_AAL2` ayarlanmazsa Edge Functions güvenli varsayılan olarak MFA'yı gerekli kabul eder; yalnız açıkça `false` verilirse gevşer.
- Topluluk gönderisi ve topluluk yöneticisi kamu profili yazma işlemlerinde RLS seviyesinde `aal2` kontrolü.
- `community-posts` Storage yazma/silme işlemlerinde AAL2 + topluluk rolü + UUID tabanlı dosya yolu.
- Görselde MIME tipine ek olarak magic-byte kontrolü, gerçek decode kontrolü, 24 MP piksel sınırı, 2200 px yeniden boyutlandırma ve WEBP yeniden kodlama. Bu işlem EXIF/metadata'yı taşımaz.
- Topluluk gönderilerinde kullanıcı başına saatte 20 kayıt DB trigger limiti.
- Edge Function JSON içerik türü ve body boyutu kontrolü, dar CORS allowlist, JWT doğrulaması ve no-store response header'ları.
- Yetki atama, gönderi kaldırma, tüm cihazlardan çıkış ve hesap silmede ikinci onay.
- Hesap silmede kullanıcı e-postası sunucu tarafında aktif Auth kullanıcısıyla eşleştirilir. Yetkili hesapta AAL2 aranır.
- Secret/service-role key frontend'de kullanılmaz.
- Platform yöneticisi panelinde son yönetim işlemlerini gösteren RLS korumalı denetim kaydı.
- Profil güvenlik merkezinde doğrulanmış e-posta üzerinden parola yenileme akışı.
- CI: secret kalıbı, riskli JS primitive'leri, syntax ve proje özel güvenlik testleri.

## Canlıya almadan önce Dashboard'da yapılacaklar

1. Supabase Authentication > Bot and Abuse Protection: Turnstile veya hCaptcha etkinleştir.
2. Authentication > Rate Limits değerlerini gerçek trafik hacmine göre ayarla.
3. Authentication URL Configuration: yalnız production Site URL ve gerekli redirect allowlist'ini bırak.
4. Özel SMTP kullan; gönderici domainini doğrula ve mümkünse link tracking'i kapat.
5. `ALLOWED_ORIGINS` secret'ını yalnız production origin(ler)iyle sınırla.
6. `REQUIRE_ADMIN_AAL2=true` secret'ını açıkça tanımla.
7. Platform/topluluk/kurum yöneticilerinin Authenticator kurulumunu tamamla.
8. Supabase backup/PITR ve geri yükleme prosedürünü doğrula.
9. GitHub branch protection, 2FA, secret scanning ve CodeQL sonuçlarını aktif takip et.
10. Belediyenin özel domain/CDN katmanında HSTS, `frame-ancestors`, Permissions-Policy ve gerektiğinde COOP/CORP header'larını sunucu seviyesinde uygula. GitHub Pages bu header'ların tamamını özelleştirmeye izin vermez.

## Pentest sınırı

Repo üzerinde statik analiz, yetki/policy incelemesi, güvenlik smoke testleri ve headless render denemeleri yapılabilir. Gerçek production domain, Serdivan Cepte SSO ve belediye ağ katmanı devreye alındığında bağımsız canlı sistem testi ayrıca yapılmalıdır. Özellikle IDOR, rol yükseltme, MFA bypass, RLS, CORS, Storage upload, XSS, session revocation ve rate-limit senaryoları tekrar test edilmelidir.
