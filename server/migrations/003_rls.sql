-- Girgit: row-level security policies for gp_app. Run as `postgres`, after 002.
--
-- WHY THIS EXISTS
--
-- Supabase enables RLS on new tables. With RLS on and no policies, every role
-- except the owner is denied everything — so the server's first INSERT failed
-- with 42501 the moment it ran against production, despite working locally
-- where RLS was never switched on.
--
-- Note how it hid: RLS FILTERS selects rather than erroring, so `select count(*)
-- from gp.rooms` returned 0 and looked healthy. A read is not a proof of access.
-- Verify with a write.
--
-- WHY POLICIES RATHER THAN `disable row level security`
--
-- Disabling would be one line and would work. Keeping RLS on with an explicit
-- policy for exactly one role is strictly safer: `gp` is not exposed through
-- PostgREST today, but if it ever were, anon and authenticated would still get
-- nothing, because nothing grants them anything. The cost is that a table added
-- by a later migration needs its own policy — grants alone will not be enough.

do $$
declare t text;
begin
  foreach t in array array['rooms', 'players', 'rounds'] loop
    execute format('alter table gp.%I enable row level security', t);
    execute format('drop policy if exists gp_app_all on gp.%I', t);
    -- The server authenticates AS gp_app and is the only client. Authorisation
    -- is the role's grants, which stop at this schema; this policy exists to
    -- stop RLS denying the role its own tables, not to express a rule.
    execute format(
      'create policy gp_app_all on gp.%I for all to gp_app using (true) with check (true)', t);
  end loop;
end
$$;
