-- Girgit rounds. Run as `postgres`, after 001.
--
-- The round is stored as a single jsonb document rather than normalised into
-- rounds/clues/votes tables as the spec first sketched. The reason is that the
-- engine already owns the shape and is the only thing that may interpret it:
-- three tables would mean a second, hand-maintained model of the same state,
-- and any drift between the two is a bug the tests cannot see.
--
-- Nothing is lost by this. The race the normalised design was protecting
-- against — two players submitting the last action at once, both concluding
-- "everyone is done", both advancing the phase — is not solved by row
-- constraints anyway. It is solved by taking a lock on the room row, which is
-- what the server does.
--
-- The columns beside `state` are duplicated OUT of it purely so a human can
-- read what happened without parsing json.

create table if not exists gp.rounds (
  id         uuid        primary key default gen_random_uuid(),
  room_code  text        not null references gp.rooms(code) on delete cascade,
  round_no   int         not null,
  state      jsonb       not null,
  phase      text        not null,
  outcome    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_code, round_no)
);

comment on column gp.rounds.state is
  'The engine RoundState. Contains secret_index and the Girgit — this column '
  'never leaves the server except as a per-player payload.';

create index if not exists rounds_room_idx on gp.rounds (room_code, round_no desc);

grant select, insert, update, delete on gp.rounds to gp_app;
