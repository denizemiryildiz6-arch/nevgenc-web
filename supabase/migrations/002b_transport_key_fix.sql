-- Önceki şemayı daha önce kurduysanız bu düzeltme dosyasını çalıştırın.
-- Aynı durak adı bir hat içinde birden fazla kez geçebildiği için kararlı anahtar olarak durak sırası kullanılır.
do $$
begin
  if exists (select 1 from information_schema.table_constraints where table_schema='public' and table_name='transport_line_stops' and constraint_type='PRIMARY KEY') then
    alter table public.transport_line_stops drop constraint transport_line_stops_pkey;
  end if;
exception when undefined_object then null;
end $$;

alter table public.transport_line_stops add constraint transport_line_stops_pkey primary key (line_id,direction,stop_order);
