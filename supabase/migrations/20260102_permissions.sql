-- Add permission columns to mess_members table

alter table public.mess_members
add column if not exists can_manage_meals boolean default false,
add column if not exists can_manage_finance boolean default false,
add column if not exists can_manage_members boolean default false;

-- Update RLS if needed?
-- The RLS on mess_members is currently default. Actions handle checks.
-- We might want to ensure only managers can UPDATE these columns.
-- Using a trigger or just relying on action logic.
-- Since we are using "service role" or "manager check" in actions, it's safer.
