-- Resets the public schema, dropping the old TypeORM-era tables carried over
-- from apps/api's dev database (users, wedding_vendors, wedding_events, ...).
-- Confirmed pre-revenue / test-scale data only (13 users, 0 payments) before
-- this ran — see docs/decisions.md and memory for the full story.

drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on routines to postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to postgres, anon, authenticated, service_role;

create extension if not exists pgcrypto with schema public;
