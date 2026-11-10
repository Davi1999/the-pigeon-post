-- Harden the public schema, which is exposed through the Supabase Data API
-- (PostgREST). The application talks to Postgres directly as the table-owner
-- role and only uses Supabase for storage, so no Data API access is needed.
--
-- The table owner (`postgres`) has BYPASSRLS and keeps its ownership
-- privileges, so Drizzle/Better Auth connections are unaffected.

-- Remove every Data API privilege from the anonymous and authenticated roles.
revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;
revoke all privileges on all functions in schema public from anon, authenticated;

-- Prevent tables, sequences and functions created by future migrations (which
-- run as `postgres`) from being granted to those roles automatically.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

-- Defence in depth: even if a privilege is granted later, RLS with no policies
-- denies all rows to non-owner roles.
alter table public."user" enable row level security;
alter table public."session" enable row level security;
alter table public."account" enable row level security;
alter table public."verification" enable row level security;
alter table public."posts" enable row level security;
alter table public."comments" enable row level security;
alter table public."friend_requests" enable row level security;
alter table public."feature_requests" enable row level security;
alter table public."feature_request_likes" enable row level security;
alter table public."notifications" enable row level security;
alter table public."notification_views" enable row level security;
alter table public."site_updates" enable row level security;
