-- Run as `postgres` once the game-layer server is deployed. Girgit's settings live in
-- gp.rooms.settings now (006).

alter table gp.rooms drop constraint if exists rooms_clue_seconds_check;
alter table gp.rooms drop constraint if exists rooms_packs_check;
alter table gp.rooms drop column if exists clue_seconds;
alter table gp.rooms drop column if exists packs;
