# NevGenç v16 Güvenlik Sertleştirmesi

Bu belge üretim öncesi güvenlik kontrolünün kapsamını ve kalan operasyonel işleri özetler.

## Kodda uygulanan kontroller

- Frontend içine `service_role`, secret key veya özel anahtar konmaz. Yalnız Supabase publishable key kullanılır.
- Tüm public tablolar RLS ile korunur; rol tablolarına istemciden yazma kapalıdır.
- Topluluk/kurum/platform yetkileri Edge Function ve veritabanı seviyesinde tekrar doğrulanır.
- `content-admin`, `role-admin` ve `account-delete` için JWT doğrulaması açık olarak tanımlanmıştır.
- Edge Function CORS allowlist'i yalnız `ALLOWED_ORIGINS` değerindeki originleri kabul eder.
- Edge Function istek gövdeleri boyutlandırılır; beklenmeyen büyük JSON reddedilir.
- Yetkili işlemlere kullanıcı/işlem bazlı veritabanı destekli rate limit uygulanır.
- 5 MB üstü topluluk görselleri ve JPEG/PNG/WEBP dışındaki tipler Storage bucket tarafından reddedilir.
- Metin, e-posta, slug, URL ve tarih alanları sunucu tarafında tekrar doğrulanır.
- Kullanıcı kaynaklı metinler HTML'e yazılmadan escape edilir; dış URL'ler HTTPS ile sınırlandırılır.
- Beklenmeyen 500 hatalarının ayrıntıları istemciye gönderilmez. Loglara token, parola veya secret yazılmaz.
- Audit log metadata'sında hassas alan adları filtrelenir.
- Leaflet CDN yüklemelerinde SRI kullanılır; Supabase JS tam sürüme pinlenmiştir.
- Hesap silme gerçek `auth.admin.deleteUser` işlemiyle yapılır; son platform yöneticisi veya bir topluluğun tek yöneticisi kendini silemez.

## Platform tarafından sağlanan kontroller

- Parolalar Supabase Auth tarafından bcrypt ile salt'lı hash olarak saklanır.
- Supabase Auth kendi endpoint rate-limit'lerini uygular. Production'da Authentication > Rate Limits ve CAPTCHA ayrıca etkinleştirilmelidir.
- HTTPS GitHub Pages/Supabase üzerinde zorunludur. Özel belediye domaini kullanılırsa HSTS ve diğer HTTP başlıkları reverse proxy/CDN'de ayarlanmalıdır.

## Operasyonel olarak tamamlanması gerekenler

1. Supabase Dashboard > Authentication > Bot and Abuse Protection: Cloudflare Turnstile veya hCaptcha aç.
2. Platform yöneticileri için MFA kur; sonra Edge Function secret olarak `REQUIRE_ADMIN_AAL2=true` ayarla.
3. `ALLOWED_ORIGINS` değerini yalnız gerçek production origin(ler)iyle sınırla.
4. Supabase Auth Site URL ve Redirect URL allowlist'ini production adresine kilitle.
5. Özel SMTP kullanıldığında link tracking'i kapat ve gönderici domainini doğrula.
6. Supabase Backups/PITR durumunu plana göre aç; düzenli geri yükleme testi yap.
7. Supabase spend cap/budget alert ve GitHub billing uyarılarını Dashboard üzerinden kur.
8. GitHub branch protection, 2FA ve secret scanning aç.
9. Eski commit geçmişinde bir secret bulunduysa yalnız dosyadan silmek yetmez: anahtarı rotate et ve geçmişi temizle.
10. Serdivan Cepte SSO geldiğinde mevcut e-posta/parola girişini kaldırıp OIDC/OAuth veya tek kullanımlık authorization code akışına geçir.

## Test kapsamı

Statik kod taraması, RLS kapsam taraması, secret pattern taraması, JavaScript syntax testi, riskli DOM API taraması ve Edge Function giriş/rol kontrolleri incelenmiştir. Bu çalışma bağımsız üçüncü taraf profesyonel pentest veya belediye sızma testi raporunun yerine geçmez.

### Oturum/cookie notu

Mevcut GitHub Pages sürümü klasik server-side session cookie kullanmaz; Supabase SPA istemcisi oturumu tarayıcı storage mekanizmasında yönetir. Bu yüzden `HttpOnly cookie` maddesini sahte biçimde eklemek yerine XSS yüzeyini daraltmak kritik kabul edilmiştir. Serdivan Cepte SSO için belediye tarafında bir BFF/session katmanı kullanılacaksa cookie `HttpOnly; Secure; SameSite=Lax/Strict` olmalıdır.

### Webhook notu

Şu an dışarıdan gelen webhook endpoint'i yoktur. İleride webhook eklenirse `verify_jwt=false` yalnız o endpoint için kullanılmalı ve sağlayıcının HMAC/imza doğrulaması ham request body üzerinde zorunlu olmalıdır. Serdivan Cepte entegrasyonunda tercih edilen yol webhook değil OIDC/OAuth veya tek kullanımlık authorization code'dur.
