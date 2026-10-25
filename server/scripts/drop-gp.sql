-- Removes Games Paglu from the shared officepaglu database.
-- Run once, as postgres, in the Supabase SQL editor, after this server
-- is deployed without DATABASE_URL. It deletes every live room.
-- It does not drop any schema other than gp.

drop schema if exists gp cascade;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'gp_app') then
    drop owned by gp_app;
    drop role gp_app;
  end if;
end
$$;
