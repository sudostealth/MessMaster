-- FIX SCRIPT V2 FOR MESS MASTER
-- Run this in your Supabase SQL Editor.

-- 1. CLEANUP DUPLICATE MEALS (To allow Unique Constraint)
DELETE FROM meals a USING meals b
WHERE a.id < b.id
AND a.user_id = b.user_id
AND a.date = b.date
AND a.month_id = b.month_id;

-- 2. ADD UNIQUE CONSTRAINT TO MEALS (Fixes Bulk Upsert Error)
ALTER TABLE meals
ADD CONSTRAINT meals_user_date_month_key UNIQUE (user_id, date, month_id);

-- 3. ADD 'involved_members' TO EXPENSES (For Displaying Shoppers/Members)
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS involved_members text;

-- 4. FIX RLS FOR EXPENSES (Ensure 'added_by' and 'involved_members' are writable)
-- (The previous policy covered ALL operations so strict column permissions usually aren't an issue unless specifically defined, but good to know)
-- The previous fix_db.sql handled the Policy logic correctly.
