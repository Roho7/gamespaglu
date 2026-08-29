-- Girgit rooms — schema and the scoped role that owns them.
--
-- RUN THIS AS `postgres` IN THE SUPABASE SQL EDITOR. It creates a role, which
-- the app user cannot do.
--
-- Why a schema and a role rather than the service key: `service_role` bypasses
-- RLS on every table in the project. This database also holds officepaglu's
-- customers, addresses, orders and Razorpay references. A party-game server
-- must not be able to read any of that, and the only enforceable way to
-- guarantee it is a Postgres role with grants that stop at `gp`.

create schema if not exists gp;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'gp_app') then
    -- Replace before running. Put the same value in the server's DATABASE_URL.
    create role gp_app login password 'CHANGE_ME_BEFORE_RUNNING';
  end if;
end
$$;

-- Explicit, even though nothing here is granted by default. The whole point of
-- this file is that the boundary is written down rather than assumed.
revoke all on schema public from gp_app;
revoke all on all tables in schema public from gp_app;
revoke all on all sequences in schema public from gp_app;
revoke all on all functions in schema public from gp_app;

grant usage on schema gp to gp_app;

-- ---------------------------------------------------------------- rooms ----

create table if not exists gp.rooms (
  code           text primary key
                 check (code ~ '^[BCDFGHJKLMNPQRSTVWXYZ]{4}$'),
  game           text        not null default 'girgit',
  phase          text        not null default 'lobby',
  round_no       int         not null default 0,
  host_player_id uuid,
  created_at     timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

comment on column gp.rooms.code is
  'Four consonants. No vowels, so a code can never accidentally spell a word.';
comment on column gp.rooms.last_active_at is
  'Drives the reaper. A room dies 2h after the last thing anybody did in it.';

-- ------------------------------------------------------------- players ----

create table if not exists gp.players (
  id            uuid        primary key default gen_random_uuid(),
  room_code     text        not null references gp.rooms(code) on delete cascade,
  device_id     uuid        not null,
  name          text        not null,
  seat          int         not null,
  connected     boolean     not null default true,
  pending_leave boolean     not null default false,
  score         int         not null default 0,
  joined_at     timestamptz not null default now(),
  unique (room_code, device_id),
  unique (room_code, seat)
);

comment on column gp.players.device_id is
  'Minted in localStorage on first use. This is the entire identity story: no '
  'accounts, and a cleared browser is a new person. It is what lets a reload '
  'or a locked phone return to the same seat.';
comment on column gp.players.connected is
  'Socket presence ONLY. Never means the player left — see pending_leave.';
comment on column gp.players.pending_leave is
  'Explicit departure, applied at the next round boundary so a round is never '
  'redealt underneath the people playing it.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'rooms_host_player_id_fkey'
  ) then
    alter table gp.rooms
      add constraint rooms_host_player_id_fkey
      foreign key (host_player_id) references gp.players(id) on delete set null;
  end if;
end
$$;

create index if not exists players_room_idx on gp.players (room_code);
create index if not exists rooms_last_active_idx on gp.rooms (last_active_at);

-- --------------------------------------------------------------- grants ----

grant select, insert, update, delete on all tables in schema gp to gp_app;
grant usage, select on all sequences in schema gp to gp_app;

-- So a table added by a later migration is reachable without re-granting.
alter default privileges in schema gp
  grant select, insert, update, delete on tables to gp_app;
alter default privileges in schema gp
  grant usage, select on sequences to gp_app;
