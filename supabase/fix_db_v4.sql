-- FIX SCRIPT V4
-- Run this in your Supabase SQL Editor.

-- 1. ADD month_id TO NOTIFICATIONS
-- We add it as nullable first, but we want cascading delete.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'month_id') THEN
        ALTER TABLE notifications ADD COLUMN month_id uuid REFERENCES months(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. FIX mess_id FOREIGN KEY
-- Ensure mess_id has ON DELETE CASCADE.
-- First, try to drop existing constraint if we can guess the name or just alter it.
-- Since we don't know the exact name, we can try to drop the column constraint if possible, but safer to add if missing.
-- However, if 'mess_id' was created without a named constraint in the original schema (just 'mess_id uuid'),
-- we can ADD a foreign key constraint now.
-- If one exists, adding another might be redundant but safe if named differently.
-- Better approach: ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_mess_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_mess_id_fkey;

-- Now add it back with CASCADE
ALTER TABLE notifications
ADD CONSTRAINT notifications_mess_id_fkey
FOREIGN KEY (mess_id)
REFERENCES messes(id)
ON DELETE CASCADE;
