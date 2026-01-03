-- FIX SCRIPT V3
-- Run this in your Supabase SQL Editor.

-- 1. CLEANUP DUPLICATE MESS NAMES (Keep latest)
DELETE FROM messes a USING messes b
WHERE a.id < b.id
AND lower(a.name) = lower(b.name);

-- 2. ADD UNIQUE CONSTRAINT ON MESS NAME
CREATE UNIQUE INDEX IF NOT EXISTS unique_mess_name_idx ON messes (lower(name));

-- 3. CLEANUP DUPLICATE MEMBERSHIPS (User in multiple messes)
-- Logic: Keep the one with 'active' status, or latest 'pending'.
-- This is complex to do in one query without picking a winner.
-- We will delete rows where user_id is same, but mess_id is different, keeping the most recent joined_at.
DELETE FROM mess_members a USING mess_members b
WHERE a.user_id = b.user_id
AND a.joined_at < b.joined_at
AND a.id != b.id;

-- 4. ADD UNIQUE CONSTRAINT ON MEMBERSHIP
-- A user can only be 'active' or 'pending' in ONE mess at a time.
-- We use a partial index.
CREATE UNIQUE INDEX IF NOT EXISTS single_active_membership_idx
ON mess_members (user_id)
WHERE status IN ('active', 'pending');
