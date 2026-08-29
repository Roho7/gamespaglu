-- The clue timer is a room setting. Run as `postgres`, after 003.
--
-- Only the clue phase is timed. The vote and the escape guess deliberately are
-- not: they are moments the table is already talking through, and a clock there
-- rushes the part of the game that IS the game. `round:abort` is the recovery
-- when somebody walks off mid-vote.

alter table gp.rooms
  add column if not exists clue_seconds int not null default 60;

alter table gp.rooms
  drop constraint if exists rooms_clue_seconds_check;
alter table gp.rooms
  add constraint rooms_clue_seconds_check check (clue_seconds in (30, 60));
