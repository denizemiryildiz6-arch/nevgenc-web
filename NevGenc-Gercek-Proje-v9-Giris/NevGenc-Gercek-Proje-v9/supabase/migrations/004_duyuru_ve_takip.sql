-- NevGenç duyuru akışı, topluluk takibi ve etkinlik tercihleri.

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  kind text not null default 'Duyuru',
  source_type text not null check (source_type in ('university','municipality','community','nevgenc')),
  source_name text not null,
  community_id uuid references public.communities(id) on delete set null,
  title text not null,
  summary text,
  published_at timestamptz,
  event_start timestamptz,
  event_end timestamptz,
  event_range_text text,
  location text,
  is_event boolean not null default false,
  is_pinned boolean not null default false,
  deadline_text text,
  url text,
  source_url text,
  verified_at timestamptz,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists announcements_feed_idx on public.announcements(is_published,is_pinned desc,published_at desc);
create index if not exists announcements_source_type_idx on public.announcements(source_type);
create index if not exists announcements_community_idx on public.announcements(community_id);

create table if not exists public.community_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id,community_id)
);
create index if not exists community_follows_community_idx on public.community_follows(community_id);

create table if not exists public.announcement_responses (
  user_id uuid not null references auth.users(id) on delete cascade,
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  response text not null check (response in ('interested','attending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id,announcement_id)
);
create index if not exists announcement_responses_announcement_idx on public.announcement_responses(announcement_id,response);

alter table public.announcements enable row level security;
alter table public.community_follows enable row level security;
alter table public.announcement_responses enable row level security;

drop policy if exists "public read published announcements" on public.announcements;
create policy "public read published announcements" on public.announcements
  for select using (is_published = true);

drop policy if exists "users read own community follows" on public.community_follows;
create policy "users read own community follows" on public.community_follows
  for select using (auth.uid() = user_id);
drop policy if exists "users create own community follows" on public.community_follows;
create policy "users create own community follows" on public.community_follows
  for insert with check (auth.uid() = user_id);
drop policy if exists "users delete own community follows" on public.community_follows;
create policy "users delete own community follows" on public.community_follows
  for delete using (auth.uid() = user_id);

drop policy if exists "users read own announcement responses" on public.announcement_responses;
create policy "users read own announcement responses" on public.announcement_responses
  for select using (auth.uid() = user_id);
drop policy if exists "users create own announcement responses" on public.announcement_responses;
create policy "users create own announcement responses" on public.announcement_responses
  for insert with check (auth.uid() = user_id);
drop policy if exists "users update own announcement responses" on public.announcement_responses;
create policy "users update own announcement responses" on public.announcement_responses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users delete own announcement responses" on public.announcement_responses;
create policy "users delete own announcement responses" on public.announcement_responses
  for delete using (auth.uid() = user_id);
