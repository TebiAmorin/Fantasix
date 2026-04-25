-- =====================================================
-- FANTASIX — SUPABASE SCHEMA
-- BLAST R6 Major SLC 2026 MVP
-- Run this in Supabase SQL Editor
-- =====================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

create type user_role     as enum ('user', 'admin', 'moderator');
create type phase_type    as enum ('swiss', 'double_elimination', 'playoffs', 'groups');
create type match_status  as enum ('scheduled', 'live', 'completed', 'cancelled');
create type match_format  as enum ('bo1', 'bo3', 'bo5');

-- =====================================================
-- PROFILES
-- =====================================================

create table profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  username     text unique not null,
  avatar_url   text,
  role         user_role default 'user' not null,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

-- =====================================================
-- TOURNAMENTS
-- =====================================================

create table tournaments (
  id           uuid default uuid_generate_v4() primary key,
  name         text not null,
  slug         text unique not null,
  is_active    boolean default false not null,
  start_date   date,
  end_date     date,
  logo_url     text,
  created_at   timestamptz default now() not null
);

-- =====================================================
-- PHASES
-- A tournament has multiple phases (Double Elim → Swiss → Playoffs)
-- Each phase has its own salary cap and draft window
-- =====================================================

create table phases (
  id             uuid default uuid_generate_v4() primary key,
  tournament_id  uuid references tournaments(id) on delete cascade not null,
  name           text not null,          -- "Double Elimination", "Swiss Stage", "Playoffs"
  type           phase_type not null,
  order_index    int not null,           -- 1=first phase, 2=second, 3=playoffs
  is_active      boolean default false not null,
  draft_open     boolean default false not null,  -- admin opens/closes draft window
  salary_cap     int default 100 not null,        -- total budget per user roster
  created_at     timestamptz default now() not null
);

-- =====================================================
-- TEAMS
-- =====================================================

create table teams (
  id           uuid default uuid_generate_v4() primary key,
  name         text not null,
  short_name   text,                     -- "G2", "VIT", "NAVI"
  region       text,                     -- "EU", "NA", "LATAM", "APAC"
  logo_url     text,
  is_active    boolean default true not null,
  created_at   timestamptz default now() not null
);

-- =====================================================
-- PLAYERS
-- =====================================================

create table players (
  id            uuid default uuid_generate_v4() primary key,
  team_id       uuid references teams(id) on delete set null,
  nickname      text not null,
  real_name     text,
  role          text,                    -- "Hard Breach", "Soft Breach", "Support", "Anchor", "Flex"
  nationality   text,
  avatar_url    text,
  fantasy_cost  int default 10 not null, -- units consumed from salary_cap
  is_active     boolean default true not null,
  created_at    timestamptz default now() not null
);

-- =====================================================
-- MATCHES
-- =====================================================

create table matches (
  id                    uuid default uuid_generate_v4() primary key,
  tournament_id         uuid references tournaments(id) on delete cascade not null,
  phase_id              uuid references phases(id) on delete cascade,
  team_a_id             uuid references teams(id) not null,
  team_b_id             uuid references teams(id) not null,
  format                match_format default 'bo3' not null,
  status                match_status default 'scheduled' not null,
  winner_id             uuid references teams(id),
  team_a_maps_won       int default 0 not null,   -- Bo3 map score
  team_b_maps_won       int default 0 not null,
  scheduled_at          timestamptz,
  external_stats_url    text,                      -- link to SiegeGG
  created_at            timestamptz default now() not null
);

-- =====================================================
-- PICK'EM PREDICTIONS
-- =====================================================

create table match_predictions (
  id                    uuid default uuid_generate_v4() primary key,
  user_id               uuid references profiles(id) on delete cascade not null,
  match_id              uuid references matches(id) on delete cascade not null,
  predicted_winner_id   uuid references teams(id) not null,
  is_correct            boolean,                  -- null until match completes
  points_earned         int default 0 not null,   -- 1 if correct, 0 if not
  created_at            timestamptz default now() not null,
  unique (user_id, match_id)
);

-- =====================================================
-- FANTASY ROSTERS
-- One roster per user per phase — full redraft each phase
-- Points accumulate across phases for global leaderboard
-- =====================================================

create table fantasy_rosters (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references profiles(id) on delete cascade not null,
  tournament_id   uuid references tournaments(id) on delete cascade not null,
  phase_id        uuid references phases(id) on delete cascade not null,
  budget_spent    int default 0 not null,
  total_points    int default 0 not null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null,
  unique (user_id, phase_id)
);

-- =====================================================
-- FANTASY PICKS (5 players per roster)
-- =====================================================

create table fantasy_picks (
  id           uuid default uuid_generate_v4() primary key,
  roster_id    uuid references fantasy_rosters(id) on delete cascade not null,
  player_id    uuid references players(id) on delete cascade not null,
  points_earned int default 0 not null,
  created_at   timestamptz default now() not null,
  unique (roster_id, player_id)
);

-- =====================================================
-- PLAYER MATCH STATS (admin enters after each match)
-- =====================================================

create table player_match_stats (
  id                    uuid default uuid_generate_v4() primary key,
  match_id              uuid references matches(id) on delete cascade not null,
  player_id             uuid references players(id) on delete cascade not null,
  -- Raw inputs
  kills                 int default 0 not null,
  deaths                int default 0 not null,
  entry_kills           int default 0 not null,
  entry_deaths          int default 0 not null,
  kost                  decimal(4,3) default 0 not null,  -- 0.000–1.000
  plants                int default 0 not null,
  defuses               int default 0 not null,
  clutch_1v1            int default 0 not null,
  clutch_1v2            int default 0 not null,
  clutch_1v3            int default 0 not null,
  clutch_1v4            int default 0 not null,
  clutch_1v5            int default 0 not null,
  rounds_survived       int default 0 not null,
  rounds_played         int default 0 not null,
  -- Calculated by Postgres trigger
  fantasy_points_earned decimal(8,2) default 0 not null,
  created_at            timestamptz default now() not null,
  unique (match_id, player_id)
);

-- =====================================================
-- SCORING CONFIG (admin-editable from panel)
-- =====================================================

create table scoring_config (
  id           uuid default uuid_generate_v4() primary key,
  stat_key     text unique not null,
  label        text not null,
  value        decimal(6,2) not null,
  description  text,
  updated_at   timestamptz default now() not null
);

-- Default values (admin adjusts after testing)
insert into scoring_config (stat_key, label, value, description) values
  ('kill',               'Kill',                 2,   'Points per kill'),
  ('death',              'Death',               -1,   'Points per death (negative)'),
  ('entry_kill_bonus',   'Entry Kill Bonus',     2,   'Stacks with kill: entry kill = +4 total'),
  ('entry_death_penalty','Entry Death Penalty', -1,   'Stacks with death: entry death = -2 total'),
  ('plant',              'Plant',                4,   'Points per plant action'),
  ('defuse',             'Defuse',               4,   'Points per defuse action'),
  ('clutch_per_enemy',   'Clutch per Enemy',     3,   '1v1=+3, 1v2=+6, 1v3=+9...'),
  ('kost_multiplier',    'KOST Multiplier',     10,   'KOST decimal × multiplier (0.85 = 8.5pts)'),
  ('survival',           'Survival per Round',   1,   'Points per round survived'),
  ('map_win_bonus',      'Map Win Bonus (Bo3)',   2,   'Bonus if player team wins the map'),
  ('map_loss_penalty',   'Map Loss Penalty',      0,   'Penalty if player team loses the map');

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_matches_tournament  on matches (tournament_id);
create index idx_matches_phase       on matches (phase_id);
create index idx_matches_status      on matches (status);
create index idx_matches_scheduled   on matches (scheduled_at);
create index idx_predictions_user    on match_predictions (user_id);
create index idx_predictions_match   on match_predictions (match_id);
create index idx_rosters_user        on fantasy_rosters (user_id);
create index idx_rosters_phase       on fantasy_rosters (phase_id);
create index idx_rosters_points      on fantasy_rosters (total_points desc);
create index idx_picks_roster        on fantasy_picks (roster_id);
create index idx_stats_match         on player_match_stats (match_id);
create index idx_stats_player        on player_match_stats (player_id);
create index idx_players_team        on players (team_id);
create index idx_players_cost        on players (fantasy_cost);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table profiles           enable row level security;
alter table tournaments        enable row level security;
alter table phases             enable row level security;
alter table teams              enable row level security;
alter table players            enable row level security;
alter table matches            enable row level security;
alter table match_predictions  enable row level security;
alter table fantasy_rosters    enable row level security;
alter table fantasy_picks      enable row level security;
alter table player_match_stats enable row level security;
alter table scoring_config     enable row level security;

-- Public read (all tables except predictions lock)
create policy "public_read_profiles"     on profiles           for select using (true);
create policy "public_read_tournaments"  on tournaments        for select using (true);
create policy "public_read_phases"       on phases             for select using (true);
create policy "public_read_teams"        on teams              for select using (true);
create policy "public_read_players"      on players            for select using (true);
create policy "public_read_matches"      on matches            for select using (true);
create policy "public_read_stats"        on player_match_stats for select using (true);
create policy "public_read_scoring"      on scoring_config     for select using (true);
create policy "public_read_rosters"      on fantasy_rosters    for select using (true);
create policy "public_read_picks"        on fantasy_picks      for select using (true);
create policy "public_read_predictions"  on match_predictions  for select using (true);

-- Profiles: own write
create policy "own_update_profile" on profiles for update using (auth.uid() = id);
create policy "own_insert_profile" on profiles for insert with check (auth.uid() = id);

-- Predictions: own write (locked once match is live/completed)
create policy "own_insert_prediction" on match_predictions for insert with check (
  auth.uid() = user_id
  and (select status from matches where id = match_id) = 'scheduled'
);
create policy "own_update_prediction" on match_predictions for update using (
  auth.uid() = user_id
  and (select status from matches where id = match_id) = 'scheduled'
);

-- Fantasy rosters: own write (only when draft is open)
create policy "own_insert_roster" on fantasy_rosters for insert with check (
  auth.uid() = user_id
  and (select draft_open from phases where id = phase_id) = true
);
create policy "own_update_roster" on fantasy_rosters for update using (auth.uid() = user_id);
create policy "own_delete_roster" on fantasy_rosters for delete using (auth.uid() = user_id);

-- Fantasy picks: own write (via roster ownership)
create policy "own_insert_pick" on fantasy_picks for insert with check (
  auth.uid() = (select user_id from fantasy_rosters where id = roster_id)
);
create policy "own_delete_pick" on fantasy_picks for delete using (
  auth.uid() = (select user_id from fantasy_rosters where id = roster_id)
);

-- Admin: full access (role check)
create policy "admin_all_tournaments"  on tournaments        for all using ((select role from profiles where id = auth.uid()) in ('admin'));
create policy "admin_all_phases"       on phases             for all using ((select role from profiles where id = auth.uid()) in ('admin'));
create policy "admin_all_teams"        on teams              for all using ((select role from profiles where id = auth.uid()) in ('admin'));
create policy "admin_all_players"      on players            for all using ((select role from profiles where id = auth.uid()) in ('admin'));
create policy "admin_all_matches"      on matches            for all using ((select role from profiles where id = auth.uid()) in ('admin'));
create policy "admin_all_stats"        on player_match_stats for all using ((select role from profiles where id = auth.uid()) in ('admin'));
create policy "admin_all_scoring"      on scoring_config     for all using ((select role from profiles where id = auth.uid()) in ('admin'));
create policy "admin_resolve_preds"    on match_predictions  for update using ((select role from profiles where id = auth.uid()) in ('admin'));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- 1. Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'preferred_username',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. Calculate fantasy points from scoring_config
create or replace function calculate_fantasy_points(stats player_match_stats)
returns decimal
language plpgsql
as $$
declare
  cfg       record;
  pts       decimal := 0;
  clutch_enemies int;
begin
  -- Load config values
  select
    max(case when stat_key = 'kill'                then value end) as kill,
    max(case when stat_key = 'death'               then value end) as death,
    max(case when stat_key = 'entry_kill_bonus'    then value end) as entry_kill_bonus,
    max(case when stat_key = 'entry_death_penalty' then value end) as entry_death_penalty,
    max(case when stat_key = 'plant'               then value end) as plant,
    max(case when stat_key = 'defuse'              then value end) as defuse,
    max(case when stat_key = 'clutch_per_enemy'    then value end) as clutch_per_enemy,
    max(case when stat_key = 'kost_multiplier'     then value end) as kost_multiplier,
    max(case when stat_key = 'survival'            then value end) as survival
  into cfg
  from scoring_config;

  -- Basic K/D
  pts := pts + (stats.kills          * coalesce(cfg.kill, 0));
  pts := pts + (stats.deaths         * coalesce(cfg.death, 0));

  -- Entry bonuses (stack with K/D)
  pts := pts + (stats.entry_kills    * coalesce(cfg.entry_kill_bonus, 0));
  pts := pts + (stats.entry_deaths   * coalesce(cfg.entry_death_penalty, 0));

  -- Objective
  pts := pts + (stats.plants         * coalesce(cfg.plant, 0));
  pts := pts + (stats.defuses        * coalesce(cfg.defuse, 0));

  -- Survival
  pts := pts + (stats.rounds_survived * coalesce(cfg.survival, 0));

  -- KOST (decimal 0-1 × multiplier)
  pts := pts + (stats.kost           * coalesce(cfg.kost_multiplier, 0));

  -- Clutches: sum of (clutch_1vX * X enemies)
  clutch_enemies :=
    (stats.clutch_1v1 * 1) +
    (stats.clutch_1v2 * 2) +
    (stats.clutch_1v3 * 3) +
    (stats.clutch_1v4 * 4) +
    (stats.clutch_1v5 * 5);
  pts := pts + (clutch_enemies       * coalesce(cfg.clutch_per_enemy, 0));

  return pts;
end;
$$;

-- 3. Trigger: calculate points BEFORE insert/update on stats
create or replace function on_stats_upsert()
returns trigger
language plpgsql
as $$
begin
  new.fantasy_points_earned := calculate_fantasy_points(new);
  return new;
end;
$$;

create trigger stats_calculate_points
  before insert or update on player_match_stats
  for each row execute procedure on_stats_upsert();

-- 4. Trigger: propagate points to fantasy_picks AFTER insert/update
create or replace function on_stats_after_upsert()
returns trigger
language plpgsql
as $$
declare
  pts_delta decimal;
begin
  -- If updating, adjust for the difference
  if tg_op = 'UPDATE' then
    pts_delta := new.fantasy_points_earned - old.fantasy_points_earned;
  else
    pts_delta := new.fantasy_points_earned;
  end if;

  -- Update points on all picks for this player in this match's phase
  update fantasy_picks fp
  set points_earned = fp.points_earned + pts_delta
  from fantasy_rosters fr
  join phases ph on ph.id = fr.phase_id
  join matches m  on m.phase_id = ph.id
  where fp.roster_id = fr.id
    and fp.player_id = new.player_id
    and m.id = new.match_id;

  -- Recalculate roster totals
  update fantasy_rosters fr
  set
    total_points = (
      select coalesce(sum(fp2.points_earned), 0)
      from fantasy_picks fp2
      where fp2.roster_id = fr.id
    ),
    updated_at = now()
  where fr.id in (
    select fr2.id
    from fantasy_rosters fr2
    join phases ph on ph.id = fr2.phase_id
    join matches m  on m.phase_id = ph.id
    where m.id = new.match_id
      and fr2.id in (
        select roster_id from fantasy_picks where player_id = new.player_id
      )
  );

  return new;
end;
$$;

create trigger stats_update_fantasy_after
  after insert or update on player_match_stats
  for each row execute procedure on_stats_after_upsert();

-- 5. Trigger: auto-resolve Pick'Em predictions when match winner is set
create or replace function on_match_winner_set()
returns trigger
language plpgsql
as $$
begin
  if new.winner_id is not null and (old.winner_id is null or old.winner_id != new.winner_id) then
    update match_predictions
    set
      is_correct    = (predicted_winner_id = new.winner_id),
      points_earned = case when predicted_winner_id = new.winner_id then 1 else 0 end
    where match_id = new.id;
  end if;
  return new;
end;
$$;

create trigger match_resolve_predictions
  after update on matches
  for each row execute procedure on_match_winner_set();

-- =====================================================
-- VIEWS (for leaderboards)
-- =====================================================

-- Fantasy global leaderboard (sum across all phases)
create view fantasy_leaderboard as
select
  p.id              as user_id,
  p.username,
  p.avatar_url,
  sum(fr.total_points) as total_points,
  count(distinct fr.phase_id) as phases_played
from profiles p
join fantasy_rosters fr on fr.user_id = p.id
group by p.id, p.username, p.avatar_url
order by total_points desc;

-- Pick'Em leaderboard
create view pickem_leaderboard as
select
  p.id         as user_id,
  p.username,
  p.avatar_url,
  sum(mp.points_earned)                           as total_points,
  count(*) filter (where mp.is_correct = true)    as correct_picks,
  count(*) filter (where mp.is_correct is not null) as resolved_picks,
  case
    when count(*) filter (where mp.is_correct is not null) > 0
    then round(
      count(*) filter (where mp.is_correct = true)::decimal /
      count(*) filter (where mp.is_correct is not null) * 100, 1
    )
    else 0
  end as accuracy_pct
from profiles p
join match_predictions mp on mp.user_id = p.id
group by p.id, p.username, p.avatar_url
order by total_points desc;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
