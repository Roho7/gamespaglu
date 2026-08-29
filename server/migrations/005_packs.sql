-- Word packs per room. Run as `postgres`, after 004.
--
-- A room chooses which packs are in play. The column is never empty: an empty
-- selection is an empty deck, which is the failure this codebase has shipped
-- once already and now guards against everywhere.

alter table gp.rooms
  add column if not exists packs text[] not null
    default array['movies-tv','people','characters','brands','everyday'];

alter table gp.rooms drop constraint if exists rooms_packs_check;
alter table gp.rooms
  add constraint rooms_packs_check
  check (
    array_length(packs, 1) >= 1
    and packs <@ array['movies-tv','people','characters','brands','everyday']
  );
