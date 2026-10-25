-- The game layer. Run as `postgres`, after 005.
--
-- Rooms now belong to one of several games, each with its own settings. Settings move into one
-- jsonb document the game validates, so a new game never needs a column. The deadline is lifted
-- out of round state so the sweep can find overdue rounds without knowing any game's shape.
--
-- clue_seconds and packs are backfilled and left in place, so the previous server keeps working
-- until the new one is deployed. 007 drops them.

alter table gp.rooms
  add column if not exists settings jsonb not null default '{}'::jsonb;

update gp.rooms
   set settings = jsonb_build_object('clueSeconds', clue_seconds, 'packs', to_jsonb(packs))
 where game = 'girgit' and settings = '{}'::jsonb;

alter table gp.rooms drop constraint if exists rooms_game_check;
alter table gp.rooms
  add constraint rooms_game_check check (game in ('girgit', 'mafia'));

alter table gp.rounds
  add column if not exists deadline_at timestamptz;

update gp.rounds
   set deadline_at = to_timestamp((state->>'deadlineAt')::bigint / 1000.0)
 where state ? 'deadlineAt' and jsonb_typeof(state->'deadlineAt') = 'number';

create index if not exists rounds_deadline_idx on gp.rounds (deadline_at)
  where deadline_at is not null;
