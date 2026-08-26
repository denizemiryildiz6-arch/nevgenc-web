-- Only source-verified seed records. Coordinates that are not yet verified remain NULL.
insert into public.partners (slug,name,category,address,phone,website_url,source_name,source_url,verified_at,is_active)
values
('pandora-sakarya','Pandora Sakarya Güzellik Merkezi','Güzellik Merkezi','İstiklal Mah. Muhsin Yazıcıoğlu Bulvarı No:63, Okur İş Merkezi, Serdivan / Sakarya','+90 501 250 54 55','https://pandorasakarya.com/','Pandora Sakarya resmî sitesi','https://pandorasakarya.com/','2026-08-26',true),
('british-way-sakarya','British Way Yabancı Dil Kursu Sakarya','Yabancı Dil Kursu','Cumhuriyet Mahallesi Telli Sokak No:3, Adapazarı / Sakarya','+90 264 777 35 55',null,'İşletme kaydı / şube iletişimi','https://www.bemarkariyer.net/sube/sakarya','2026-08-26',true),
('reyhan-pasta-cafe','Reyhan Pasta Cafe','Pastane / Cafe','Arabacıalanı Mahallesi Eski Kazımpaşa Caddesi No:253, Serdivan / Sakarya','+90 555 073 94 26','https://www.reyhancihanpastacafe.com/','Reyhan Cihan Pasta&Cafe resmî sitesi','https://www.reyhancihanpastacafe.com/','2026-08-26',true)
on conflict (slug) do update set name=excluded.name,category=excluded.category,address=excluded.address,phone=excluded.phone,website_url=excluded.website_url,source_url=excluded.source_url,verified_at=excluded.verified_at,is_active=true;

insert into public.map_locations (slug,type,name,address,phone,latitude,longitude,source_name,source_url,verified_at,is_active)
values
('sau-esentepe','campus','Sakarya Üniversitesi Esentepe Kampüsü','Kemalpaşa Mahallesi Üniversite Caddesi, 54050 Serdivan / Sakarya',null,40.741009,30.332767,'SAÜ / coğrafi kaynak','https://sakarya.edu.tr/iletisim','2026-08-26',true),
('sau-merkez-kutuphane','library','SAÜ Merkez Kütüphanesi','Ana Bina Kapı No: 49, Esentepe Kampüsü, 54050 Serdivan / Sakarya','+90 264 295 53 58',null,null,'SAÜ Kütüphane','https://kutuphane.sakarya.edu.tr/tr/27111/iletisim','2026-08-26',true),
('sau-ogrenci-yemekhanesi','dining','Sakarya Üniversitesi Öğrenci Yemekhanesi','Esentepe Mahallesi, Akademiyolu Sokak 5-12, Serdivan / Sakarya',null,null,null,'Harita işletme kaydı','https://yandex.com.tr/maps/org/sakarya_universitesi_ogrenci_yemekhanesi/118986269141/','2026-08-26',true)
on conflict (slug) do update set name=excluded.name,address=excluded.address,phone=excluded.phone,latitude=coalesce(excluded.latitude,public.map_locations.latitude),longitude=coalesce(excluded.longitude,public.map_locations.longitude),source_url=excluded.source_url,verified_at=excluded.verified_at,is_active=true;

insert into public.transport_lines (code,name,source_url,verified_at,is_active)
select x.code,x.name,'https://sakus.sakarya.bel.tr/harita','2026-08-26',true from (values
('4','Kampüs – Sakaryapark'),('6','Kampüs Hattı'),('12','Kampüs Hattı'),('15','Kampüs Hattı'),('16K','Kampüs Hattı'),('19K','Kampüs Hattı'),('20','Kampüs Hattı'),('20A','Kampüs Hattı'),('21K','Kampüs Hattı'),('22K','Kampüs Hattı'),('24K','Kampüs Hattı'),('26','Kampüs Hattı'),('27','Kampüs Hattı'),('29','Yeni Terminal – Kampüs')) as x(code,name)
on conflict(code) do update set name=excluded.name,source_url=excluded.source_url,verified_at=excluded.verified_at,is_active=true;
