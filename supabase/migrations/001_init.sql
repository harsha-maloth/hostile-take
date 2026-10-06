-- Hostile Take: initial schema. Run in Supabase SQL editor or via `supabase db push`.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Anonymous raider',
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed bigint not null,
  difficulty smallint not null default 1 check (difficulty between 1 and 4),
  turn int not null default 0,
  status text not null default 'active' check (status in ('active','finished','bankrupt')),
  state jsonb not null default '{}'::jsonb,
  net_worth numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table public.game_actions (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  turn int not null,
  action jsonb not null,
  created_at timestamptz not null default now()
);

create table public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null unique references public.games(id) on delete cascade,
  final_net_worth numeric not null,
  turns int not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.games (user_id, updated_at desc);
create index on public.game_actions (game_id, turn);
create index on public.scores (final_net_worth desc) where verified;

alter table public.profiles     enable row level security;
alter table public.games        enable row level security;
alter table public.game_actions enable row level security;
alter table public.scores       enable row level security;

-- profiles: public read (for the leaderboard), own write
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

-- games: owner only
create policy "games own" on public.games for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- game_actions: owner of the parent game only
create policy "actions own" on public.game_actions for all
  using (exists (select 1 from public.games g where g.id = game_id and g.user_id = auth.uid()))
  with check (exists (select 1 from public.games g where g.id = game_id and g.user_id = auth.uid()));

-- scores: everyone reads verified scores; NO client writes (Edge Function uses the service role)
create policy "scores read verified" on public.scores for select using (verified);

-- auto-create a profile on signup
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
