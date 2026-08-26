-- NevGenç core schema — public client safe with RLS.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  university text,
  department text,
  avatar_url text,
  n_points integer not null default 0 check (n_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  description text,
  contact_email text,
  phone text,
  instagram_url text,
  x_url text,
  linkedin_url text,
  logo_url text,
  source_name text,
  source_url text,
  verified_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists communities_category_idx on public.communities(category);
create index if not exists communities_active_idx on public.communities(is_active);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text,
  description text,
  address text not null,
  phone text,
  email text,
  website_url text,
  logo_url text,
  benefit_text text,
  latitude double precision,
  longitude double precision,
  source_name text,
  source_url text,
  verified_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.map_locations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  type text not null check (type in ('campus','library','dining','partner','stop','other')),
  name text not null,
  category text,
  address text,
  phone text,
  latitude double precision,
  longitude double precision,
  source_name text,
  source_url text,
  verified_at timestamptz,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists map_locations_type_idx on public.map_locations(type);

create table if not exists public.transport_lines (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  color text,
  route_geojson jsonb,
  source_url text,
  verified_at timestamptz,
  is_active boolean not null default true
);
create table if not exists public.transport_stops (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  latitude double precision,
  longitude double precision,
  source_url text,
  verified_at timestamptz,
  is_active boolean not null default true
);
create table if not exists public.transport_line_stops (
  line_id uuid references public.transport_lines(id) on delete cascade,
  stop_id uuid references public.transport_stops(id) on delete cascade,
  stop_order integer not null,
  direction text not null default 'outbound',
  primary key (line_id,direction,stop_order)
);
create index if not exists transport_line_stops_order_idx on public.transport_line_stops(line_id,direction,stop_order);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  type text not null,
  title text not null,
  summary text,
  organization text,
  url text,
  deadline date,
  published_at timestamptz not null default now(),
  source_name text,
  source_url text,
  verified_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists opportunities_published_idx on public.opportunities(is_published,published_at desc);

create table if not exists public.dining_menus (
  id uuid primary key default gen_random_uuid(),
  menu_date date unique not null,
  source_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.dining_menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.dining_menus(id) on delete cascade,
  item_order integer not null,
  name text not null,
  calories integer,
  unique(menu_id,item_order)
);

create table if not exists public.library_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity integer check(capacity is null or capacity >= 0),
  reservable boolean not null default false,
  is_active boolean not null default true
);
create table if not exists public.library_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references public.library_spaces(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check(status in ('confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.partners enable row level security;
alter table public.map_locations enable row level security;
alter table public.transport_lines enable row level security;
alter table public.transport_stops enable row level security;
alter table public.transport_line_stops enable row level security;
alter table public.opportunities enable row level security;
alter table public.dining_menus enable row level security;
alter table public.dining_menu_items enable row level security;
alter table public.library_spaces enable row level security;
alter table public.library_reservations enable row level security;

-- Public, read-only datasets
create policy "public read active communities" on public.communities for select using (is_active = true);
create policy "public read active partners" on public.partners for select using (is_active = true);
create policy "public read active map locations" on public.map_locations for select using (is_active = true);
create policy "public read active lines" on public.transport_lines for select using (is_active = true);
create policy "public read active stops" on public.transport_stops for select using (is_active = true);
create policy "public read line stops" on public.transport_line_stops for select using (true);
create policy "public read published opportunities" on public.opportunities for select using (is_published = true);
create policy "public read dining menus" on public.dining_menus for select using (true);
create policy "public read dining items" on public.dining_menu_items for select using (true);
create policy "public read library spaces" on public.library_spaces for select using (is_active = true);

-- User-owned data
create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users read own reservations" on public.library_reservations for select using (auth.uid() = user_id);
create policy "users create own reservations" on public.library_reservations for insert with check (auth.uid() = user_id);
create policy "users update own reservations" on public.library_reservations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Profile bootstrap after Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
