-- Bonzaipon database schema
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query) once,
-- against a fresh project. Safe to re-run: it drops and recreates app objects.

-- ---------------------------------------------------------------------------
-- Clean slate (app objects only; never touches auth.*)
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.complete_task(uuid, text) cascade;
drop function if exists public.roll_tickets(integer, date) cascade;
drop function if exists public.sync_day(date) cascade;
drop function if exists public.spend_vice_coin() cascade;
drop table if exists public.task_completions cascade;
drop table if exists public.preset_tasks cascade;
drop table if exists public.profiles cascade;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per user. Holds the editable variables, balances, and progress.
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  gold_chance     numeric(6,3) not null default 0.5,   -- percent, e.g. 0.5 = 0.5%
  vice_chance     numeric(6,3) not null default 3.0,   -- percent
  copper_rollover integer      not null default 100,   -- copper coins -> 1 vice coin
  tickets         integer      not null default 0,
  gold_coins      integer      not null default 0,
  vice_coins      integer      not null default 0,
  copper_coins    integer      not null default 0,
  running_total   integer      not null default 0,     -- lifetime tasks completed
  current_streak  integer      not null default 0,
  highest_streak  integer      not null default 0,
  current_day     date         not null default current_date,
  created_at      timestamptz  not null default now(),
  constraint chances_valid check (
    gold_chance >= 0 and vice_chance >= 0 and (gold_chance + vice_chance) <= 100
  ),
  constraint rollover_valid check (copper_rollover >= 1)
);

-- User-editable preset tasks to choose from.
create table public.preset_tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text not null check (char_length(label) between 1 and 120),
  sort_order integer not null default 0,
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);
create index preset_tasks_user_idx on public.preset_tasks(user_id, archived, sort_order);

-- One row per check-off. `day` is the local day it counted for.
create table public.task_completions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  preset_task_id uuid references public.preset_tasks(id) on delete set null,
  label          text not null,            -- snapshot, survives preset edits
  note           text,                     -- optional elaboration
  day            date not null default current_date,
  completed_at   timestamptz not null default now()
);
create index task_completions_user_day_idx on public.task_completions(user_id, day);

-- ---------------------------------------------------------------------------
-- Row Level Security: every user sees only their own rows
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.preset_tasks    enable row level security;
alter table public.task_completions enable row level security;

create policy "own profile"        on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own presets"        on public.preset_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own completions"    on public.task_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- New-user bootstrap: create a profile + seed a few default presets
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.preset_tasks (user_id, label, sort_order) values
    (new.id, 'Perform dreaded task', 0),
    (new.id, 'Exercise',             1),
    (new.id, 'Tidy up',              2),
    (new.id, 'Eat something healthy',3);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- sync_day: roll the day over if the client's local date is newer.
-- Called on app open. Lumps in any missed days so nothing is lost.
-- Returns the (possibly updated) profile row.
-- ---------------------------------------------------------------------------
create function public.sync_day(p_client_day date)
returns public.profiles
language plpgsql
security definer set search_path = public
as $$
declare
  prof public.profiles;
  day_count integer;
begin
  select * into prof from public.profiles where id = auth.uid() for update;
  if prof.id is null then
    raise exception 'no profile';
  end if;

  if p_client_day > prof.current_day then
    select count(*) into day_count
      from public.task_completions
     where user_id = auth.uid() and day < p_client_day;

    update public.profiles set
      tickets        = tickets + day_count,
      running_total  = running_total + day_count,
      current_streak = current_streak + day_count,
      highest_streak = greatest(highest_streak, current_streak + day_count),
      current_day    = p_client_day
    where id = auth.uid()
    returning * into prof;

    delete from public.task_completions
      where user_id = auth.uid() and day < p_client_day;
  end if;

  return prof;
end;
$$;

-- ---------------------------------------------------------------------------
-- complete_task: log one completion of a preset task (with optional note).
-- ---------------------------------------------------------------------------
create function public.complete_task(p_task_id uuid, p_note text)
returns public.task_completions
language plpgsql
security definer set search_path = public
as $$
declare
  lbl text;
  the_day date;
  row public.task_completions;
begin
  select label into lbl from public.preset_tasks
    where id = p_task_id and user_id = auth.uid();
  if lbl is null then
    raise exception 'task not found';
  end if;

  -- Tag the completion with the profile's current (local) day so it stays
  -- consistent with what the Today screen filters on, regardless of UTC.
  select current_day into the_day from public.profiles where id = auth.uid();

  insert into public.task_completions (user_id, preset_task_id, label, note, day)
  values (auth.uid(), p_task_id, lbl, nullif(trim(coalesce(p_note,'')), ''), the_day)
  returning * into row;

  return row;
end;
$$;

-- ---------------------------------------------------------------------------
-- roll_tickets: sync the day, then roll `p_count` tickets server-side.
-- Returns json: { results: ['gold'|'vice'|'copper', ...],
--                 rollovers: <int>, profile: <profile row> }
-- ---------------------------------------------------------------------------
create function public.roll_tickets(p_count integer, p_client_day date)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  prof public.profiles;
  i integer;
  r numeric;
  results text[] := '{}';
  outcome text;
  rollovers integer := 0;
begin
  if p_count not in (1, 10) then
    raise exception 'count must be 1 or 10';
  end if;

  prof := public.sync_day(p_client_day);     -- roll day over first if needed

  if prof.tickets < p_count then
    raise exception 'not enough tickets';
  end if;

  for i in 1..p_count loop
    r := random() * 100;                      -- 0 .. 100
    if r < prof.gold_chance then
      prof.gold_coins := prof.gold_coins + 1;
      outcome := 'gold';
    elsif r < prof.gold_chance + prof.vice_chance then
      prof.vice_coins := prof.vice_coins + 1;
      outcome := 'vice';
    else
      prof.copper_coins := prof.copper_coins + 1;
      outcome := 'copper';
    end if;
    prof.tickets := prof.tickets - 1;
    results := array_append(results, outcome);
  end loop;

  -- copper -> vice conversion, the instant the threshold is reached
  while prof.copper_coins >= prof.copper_rollover loop
    prof.copper_coins := prof.copper_coins - prof.copper_rollover;
    prof.vice_coins := prof.vice_coins + 1;
    rollovers := rollovers + 1;
  end loop;

  update public.profiles set
    tickets = prof.tickets, gold_coins = prof.gold_coins,
    vice_coins = prof.vice_coins, copper_coins = prof.copper_coins
  where id = auth.uid()
  returning * into prof;

  return jsonb_build_object(
    'results', to_jsonb(results),
    'rollovers', rollovers,
    'profile', to_jsonb(prof)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- spend_vice_coin: consume one vice coin, reset current streak (as prototype).
-- ---------------------------------------------------------------------------
create function public.spend_vice_coin()
returns public.profiles
language plpgsql
security definer set search_path = public
as $$
declare
  prof public.profiles;
begin
  update public.profiles
    set vice_coins = vice_coins - 1, current_streak = 0
    where id = auth.uid() and vice_coins > 0
    returning * into prof;
  if prof.id is null then
    raise exception 'no vice coins';
  end if;
  return prof;
end;
$$;

-- Allow logged-in users to call the RPCs
grant execute on function public.sync_day(date)             to authenticated;
grant execute on function public.complete_task(uuid, text)  to authenticated;
grant execute on function public.roll_tickets(integer, date) to authenticated;
grant execute on function public.spend_vice_coin()          to authenticated;
