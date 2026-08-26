# NevGenç Yayınlama Rehberi

Bu belge GitHub Pages ve Supabase ile temel yayınlama adımlarını içerir.

## 1. Supabase projesi

Supabase üzerinde yeni bir proje oluşturun.

## 2. Veritabanı kurulumu

Supabase SQL Editor üzerinden migration dosyalarını aşağıdaki sırayla çalıştırın:

```text
001_core.sql
002_seed_verified.sql
002b_transport_key_fix.sql
003_verified_public_data.sql
004_duyuru_ve_takip.sql
005_duyuru_baslangic_verisi.sql
006_harita_dogrulanmis_koordinatlar.sql
```

Dosyalar `supabase/migrations/` klasöründedir. Daha önce kurulmuş bir veritabanında harita koordinat düzeltmesi için `006_harita_dogrulanmis_koordinatlar.sql` ayrıca çalıştırılmalıdır.

## 3. Supabase bağlantısı

Supabase Dashboard → Project Settings → API bölümünden:

- Project URL
- Public anon key

bilgilerini alın.

`assets/js/config.js` dosyasını düzenleyin:

```js
supabase: {
  url: 'https://PROJE.supabase.co',
  anonKey: 'PUBLIC_ANON_KEY'
}
```

`service_role` anahtarını bu dosyaya eklemeyin.

## 4. Yerel kontrol

Proje klasöründe:

```bash
python -m http.server 5500
```

çalıştırın ve tarayıcıdan:

```text
http://localhost:5500
```

adresini açın.

Kontrol edilmesi önerilen ekranlar:

- Ana Sayfa
- Topluluklar
- Harita
- Fırsatlar
- Profil

## 5. GitHub deposu

Dosyaları GitHub deposunun kök dizinine aktarın ve `main` dalına gönderin.

## 6. GitHub Pages

GitHub → Settings → Pages bölümünde:

**Source: GitHub Actions**

seçin.

Depodaki `.github/workflows/pages.yml` dosyası siteyi otomatik yayımlar.

## 7. Alan adı

Kurumsal alan adı kullanılacaksa GitHub Pages Custom Domain ayarı yapılabilir. DNS tarafında GitHub Pages tarafından verilen kayıtlar kullanılmalıdır.

## 8. Supabase Auth yönlendirmeleri

Kullanıcı giriş sistemi açılmadan önce Supabase Auth → URL Configuration bölümünde:

- Site URL
- Redirect URLs

alanları gerçek yayın adresine göre düzenlenmelidir.

## 9. Canlıya geçiş kontrol listesi

- [ ] Supabase migration dosyaları eksiksiz çalıştı.
- [ ] Public anon key doğru eklendi.
- [ ] RLS politikaları kontrol edildi.
- [ ] `service_role` anahtarı repoda bulunmuyor.
- [ ] Harita noktaları kontrol edildi.
- [ ] Anlaşmalı işletme bilgileri güncel.
- [ ] Otobüs hat/durak verileri güncel.
- [ ] Yemek menüsü senkronizasyon yöntemi belirlendi.
- [ ] Auth yönlendirme URL’leri ayarlandı.
- [ ] Mobil görünüm kontrol edildi.
- [ ] GitHub Pages yayını başarıyla tamamlandı.
