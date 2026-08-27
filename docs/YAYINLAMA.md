# NevGenç Yayınlama ve Devir Rehberi

## 1. GitHub deposu

Repo kökünde doğrudan şu dosyalar görünmelidir:

```text
index.html
404.html
assets/
supabase/
docs/
README.md
```

`index.html` bir üst proje klasörünün içinde bırakılmamalıdır.

## 2. Supabase migration

Yeni kurulumda `supabase/migrations/` klasöründeki dosyalar sıra numarasına göre uygulanır:

```text
001_core.sql
002_seed_verified.sql
002b_transport_key_fix.sql
003_verified_public_data.sql
004_duyuru_ve_takip.sql
005_duyuru_baslangic_verisi.sql
006_harita_dogrulanmis_koordinatlar.sql
007_kutuphane_randevu_alanlari.sql
008_guvenli_auth_roller.sql
009_guncel_resmi_veri.sql
010_topluluk_sayfalari_ve_paylasimlar.sql
011_nevplus_ve_isletme_duzeltmeleri.sql
```

Mevcut veritabanında daha önce uygulanan migration'lar yeniden çalıştırılmaz; yalnız yeni dosyalar uygulanır.

## 3. Frontend bağlantısı

`assets/js/config.js` içine Supabase Project URL ve publishable key yazılır.

`service_role`, secret key, SMTP parolası veya başka bir sunucu sırrı bu dosyaya konmaz.

## 4. Edge Functions

```bash
npx supabase@latest login
npx supabase@latest link --project-ref PROJE_REF
npx supabase@latest functions deploy content-admin --use-api
npx supabase@latest functions deploy role-admin --use-api
```

Canlı site origin'i:

```bash
npx supabase@latest secrets set ALLOWED_ORIGINS=https://ORNEK.github.io
```

## 5. GitHub Pages

İki desteklenen yöntem vardır:

### Branch yayını

`Settings → Pages → Deploy from a branch → main → /(root)`

### GitHub Actions

`Settings → Pages → Source: GitHub Actions`

Depoda `.github/workflows/pages.yml` mevcuttur.

## 6. Auth / SSO

Test aşamasında Supabase Auth kullanılıyorsa `Authentication → URL Configuration` içinde Site URL ve Redirect URLs canlı adrese göre ayarlanmalıdır.

Üretim hedefi Serdivan Cepte SSO'dur. Belediye bilgi işlem birimiyle OAuth/OIDC veya authorization-code akışı netleşmeden mevcut Auth kaldırılmamalıdır.

## 7. Canlıya geçiş kontrolü

- [ ] Repo kök yapısı doğru
- [ ] `config.js` publishable key içeriyor
- [ ] Secret/service role repoda yok
- [ ] Son migration uygulanmış
- [ ] Edge Functions deploy edilmiş
- [ ] `ALLOWED_ORIGINS` canlı domaine göre ayarlı
- [ ] RLS politikaları aktif
- [ ] Storage politikaları test edildi
- [ ] Yönetici rol testleri yapıldı
- [ ] Mobil Safari/Chrome testi yapıldı
- [ ] Harita mobil sürükleme testi yapıldı
- [ ] Topluluk paylaşım metin + görsel testi yapıldı
- [ ] Nev+ modül linkleri test edildi
- [ ] Auth/SSO callback akışı doğrulandı
