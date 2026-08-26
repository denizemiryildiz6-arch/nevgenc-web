-- Haritada sık kullanılan noktaların doğrulanmış koordinatları.
-- Bu dosya, tarayıcı tarafında adres çözümlemeye ihtiyaç bırakmadan
-- temel kampüs/işletme noktalarının doğrudan gösterilmesini sağlar.

alter table public.map_locations add column if not exists coordinate_source_url text;
alter table public.partners add column if not exists coordinate_source_url text;
alter table public.transport_stops add column if not exists coordinate_source_url text;

update public.map_locations
set latitude = 40.741670,
    longitude = 30.332080,
    coordinate_source_url = 'https://mapcarta.com/W389702261',
    verified_at = '2026-08-26'
where slug = 'sau-merkez-kutuphane';

update public.map_locations
set latitude = 40.743862,
    longitude = 30.330385,
    coordinate_source_url = 'https://yandex.com.tr/maps/org/sakarya_universitesi_ogrenci_yemekhanesi/118986269141/',
    verified_at = '2026-08-26'
where slug = 'sau-ogrenci-yemekhanesi';

update public.partners
set latitude = 40.767828,
    longitude = 30.374997,
    coordinate_source_url = 'https://pandorasakarya.com/iletisim',
    verified_at = '2026-08-26'
where slug = 'pandora-sakarya';

update public.partners
set latitude = 40.778369,
    longitude = 30.394390,
    coordinate_source_url = 'https://share.google/MaEdpWloxZ5niFPYB',
    verified_at = '2026-08-26'
where slug = 'british-way-sakarya';

update public.partners
set latitude = 40.77890817932465,
    longitude = 30.354718514833255,
    coordinate_source_url = 'https://www.reyhancihanpastacafe.com/',
    verified_at = '2026-08-26'
where slug = 'reyhan-pasta-cafe';

-- SAKUS, hat ve durak ad/sıra verisinin ana kaynağıdır. Aşağıdaki nokta
-- koordinatları harita üzerinde doğrulanabilen duraklar için sabitlenmiştir.
with verified(name, latitude, longitude, coordinate_source_url) as (
  values
    ('Kampüs', 40.74036464096624::double precision, 30.32890764464387::double precision, 'https://otobusnezaman.com/sakarya/15/kampus-duragi'),
    ('Kampüs -1', 40.74446309413712, 30.340922726463305, 'https://otobusnezaman.com/sakarya/2454/kampus-1-duragi'),
    ('BESYO-1', 40.74297079234215, 30.33792068007469, 'https://otobusnezaman.com/sakarya/2518/besyo-1-duragi'),
    ('Esentepe Giriş Kapısı', 40.743946240906155, 30.323519303020436, 'https://otobusnezaman.com/sakarya/208/esentepe-giris-kapisi-duragi'),
    ('Medar Hastanesi', 40.76088978, 30.36251513, 'https://otobusnezaman.com/sakarya/917/medar-hastanesi-duragi'),
    ('Kırcaali Cad-3', 40.74318058278871, 30.31614482402802, 'https://otobusnezaman.com/sakarya/1195/kircaali-cad-3-duragi'),
    ('Kırcaali Sokak -3', 40.74318058278871, 30.31614482402802, 'https://otobusnezaman.com/sakarya/1195/kircaali-cad-3-duragi'),
    ('Serdivan Belediyesi', 40.7718399977679, 30.36294937133788, 'https://otobusnezaman.com/sakarya/2034/serdivan-belediyesi-duragi'),
    ('Diş Hastanesi -1', 40.76016347623455, 30.36168095937521, 'https://otobusnezaman.com/sakarya/2336/dis-hastanesi-1-duragi'),
    ('KYK-1', 40.74722416, 30.35098489, 'https://otobusnezaman.com/sakarya/184/kyk-1-duragi'),
    ('Cadde 54', 40.77537787, 30.36366354, 'https://otobusnezaman.com/sakarya/935/cadde-54-duragi'),
    ('Serdivan AVM -4', 40.77871295, 30.36403478, 'https://otobusnezaman.com/sakarya/863/serdivan-avm-4-duragi'),
    ('Üniversite Caddesi -1', 40.7493296, 30.35218969, 'https://otobusnezaman.com/sakarya/934/universite-caddesi-1-duragi'),
    ('Millet Bahçesi', 40.77571424, 30.38680067, 'https://otobusnezaman.com/sakarya/699/millet-bahcesi-duragi'),
    ('Orta Garaj -1', 40.7740169046228, 30.3945761946368, 'https://otobusnezaman.com/sakarya/698/orta-garaj-1-duragi'),
    ('Sakarya Eğitim Araştırma Hastanesi', 40.75833431735848, 30.387851455963453, 'https://otobusnezaman.com/sakarya/433/sakarya-egitim-arastirma-hastanesi-duragi'),
    ('Orman Park', 40.75656118801337, 30.386332869529728, 'https://otobusnezaman.com/sakarya/59/orman-park-duragi'),
    ('Orman park -1', 40.75618881121406, 30.385493338108066, 'https://otobusnezaman.com/sakarya/1059/orman-park-1-duragi'),
    ('Donatım Terminali-2', 40.7713047061625, 30.3913298100899, 'https://otobusnezaman.com/sakarya/968/donatim-terminali-2-duragi')
)
update public.transport_stops s
set latitude = v.latitude,
    longitude = v.longitude,
    coordinate_source_url = v.coordinate_source_url,
    verified_at = '2026-08-26'
from verified v
where s.name = v.name;
