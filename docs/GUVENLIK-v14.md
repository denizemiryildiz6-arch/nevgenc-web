# NevGenç v13 Güvenlik Kontrolü

Bu doküman v13 topluluk yönetimi ve paylaşım özellikleri için yapılan uygulama-seviyesi güvenlik kontrollerini özetler. Bu çalışma bağımsız üçüncü taraf sızma testi yerine geçmez; üretime çıkmadan önce ayrıca dış pentest yapılması önerilir.

## Kontrol edilen başlıklar

- Yetkisiz topluluk adına gönderi oluşturma
- Yetkisiz topluluk görseli yükleme/silme
- Topluluk başına yönetici sınırının korunması
- Platform admin sınırının korunması
- Auth e-postalarının public sayfalara sızmaması
- Public yönetici iletişim e-postasının açık rıza ile ayrı alanda tutulması
- Topluluk gönderilerinde kullanıcı UUID'sinin public API üzerinden görünmemesi
- XSS / HTML enjeksiyonu için kullanıcı metinlerinin escape edilmesi
- `javascript:` ve güvensiz URL şemalarının engellenmesi
- Görsel türü ve boyutu kısıtlaması
- Frontend içinde `service_role` / secret key bulunmaması
- Inline event handler kullanılmaması
- CSP'nin script çalıştırma yüzeyini sınırlandırması
- Edge Function işlemlerinde bearer token + rol kontrolü
- Kurum/topluluk profil güncellemelerinde server-side yetki kontrolü

## Uygulanan önlemler

1. `community_posts` yazma işlemleri RLS ile ilgili topluluğun yöneticisi veya platform admin ile sınırlandırılmıştır.
2. Storage yolu kullanıcı girdisinden oluşturulmaz. Yol yalnızca `community_id/random_uuid.ext` biçimindedir.
3. `community-posts` bucket yalnız JPEG, PNG ve WEBP kabul eder; maksimum dosya boyutu 5 MB'dir.
4. Public topluluk gönderi görünümü `author_id` döndürmez.
5. Public yönetici görünümü `user_id`, giriş e-postası veya `email_lower` döndürmez.
6. Yönetici giriş e-postası hiçbir zaman otomatik olarak iletişim e-postasına kopyalanmaz.
7. Topluluk ve yönetici iletişim alanlarında yalnız normalleştirilmiş e-posta kabul edilir.
8. Topluluk profilini düzenleme işlemi Edge Function içinde yeniden yetkilendirilir.
9. Kullanıcı tarafından girilen metinler HTML oluşturulurken escape edilir.
10. Dış URL'ler yalnız HTTPS olarak kabul edilir.

## Yapılan statik testler

- Tüm frontend JavaScript dosyaları `node --check` ile sözdizimi kontrolünden geçti.
- Topluluk detay ve yönetim paneli şablonları sahte veriyle render edilerek yapısal testten geçti.
- Test girdisine `<script>alert(1)</script>` verilerek çıktıda HTML escape edildiği doğrulandı.
- Frontend dosyalarında `service_role`, `sb_secret_`, `SUPABASE_SERVICE_ROLE_KEY` benzeri secret key belirteçleri tarandı; bulunmadı.
- Frontend dosyalarında inline `onclick/onerror/onload` ve `javascript:` URL taraması yapıldı; bulunmadı.
- Local runtime browser testi çalışma ortamı tarafından engellendiği için gerçek tarayıcı regresyonu bu ortamda otomatik koşturulamadı. Bu nedenle GitHub Pages staging üzerinde mobil/desktop manuel regresyon testi yapılmalıdır.

## Üretim öncesi zorunlu kontrol

- Supabase `010_topluluk_sayfalari_ve_paylasimlar.sql` migration'ını staging üzerinde çalıştırın.
- `content-admin` ve `role-admin` Edge Function'larını yeniden deploy edin.
- `ALLOWED_ORIGINS` secret'ını gerçek GitHub Pages origin'i veya özel domain ile sınırlayın.
- Bir normal öğrenci hesabıyla topluluk gönderisi yazma denemesi yapın; başarısız olmalıdır.
- Bir topluluk yöneticisiyle başka topluluk ID'sine POST/Storage yazma denemesi yapın; RLS tarafından reddedilmelidir.
- 5 MB üzeri ve `image/svg+xml` yükleme denemesi yapın; reddedilmelidir.
- Public API cevaplarında `author_id`, `user_id`, `email_lower` ve auth giriş e-postası bulunmadığını tekrar kontrol edin.

## v14 ek kontrol alanları

- Nev+ oyunları yalnız istemci tarafında çalışır ve skor için kişisel veri toplamaz.
- `Kampüs Pazarı` modülü moderasyon, içerik güvenliği ve ilan yaşam döngüsü tamamlanmadan yazma işlemine açılmaz.
- Sosyal tesis verileri public read modeliyle tutulur; yönetim yazma yetkisi public role verilmez.
- Fiyat karşılaştırması doğrulanmış ve tarih damgalı veri olmadan kullanıcıya kesin sonuç olarak sunulmaz.
- Serdivan Cepte SSO entegrasyonunda e-posta veya uzun ömürlü bearer token URL parametresinde taşınmamalıdır.
