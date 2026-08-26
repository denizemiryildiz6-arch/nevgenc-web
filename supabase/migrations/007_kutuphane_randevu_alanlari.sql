-- NevGenç kütüphane randevu modülü için başlangıç alanları.
-- Kapasite bilgisi bilinçli olarak NULL bırakılmıştır; doğrulanmamış doluluk verisi gösterilmez.

insert into public.library_spaces (name, capacity, reservable, is_active)
select 'Merkez Kütüphane - Bireysel Çalışma Alanı', null, true, true
where not exists (
  select 1 from public.library_spaces where name = 'Merkez Kütüphane - Bireysel Çalışma Alanı'
);

insert into public.library_spaces (name, capacity, reservable, is_active)
select 'Merkez Kütüphane - Grup Çalışma Alanı', null, true, true
where not exists (
  select 1 from public.library_spaces where name = 'Merkez Kütüphane - Grup Çalışma Alanı'
);
