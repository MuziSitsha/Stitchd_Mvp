-- The wedding date shown throughout the app (WEDDING.dateLabel in data.ts) is
-- hardcoded demo copy, never persisted anywhere. Date-collision detection
-- (supplier double-bookings) and in-app "days until" reminders both need a
-- real date to work from. Nullable — existing rows/onboarding flows without
-- a date keep working unchanged.
alter table public.events add column event_date date;
