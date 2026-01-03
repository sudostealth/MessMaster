-- FIX SCRIPT FOR MESS MASTER
-- Run this in your Supabase SQL Editor to fix RLS permissions and Schema issues.

-- 1. ADD MISSING COLUMNS
-- Ensure 'added_by' exists in meals
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meals' AND column_name = 'added_by') THEN
        ALTER TABLE meals ADD COLUMN added_by uuid REFERENCES profiles(id);
    END IF;
END $$;

-- 2. FIX RLS FOR MESS MEMBERS (Allow Managers to Add Members)
DROP POLICY IF EXISTS "Users can join a mess" ON mess_members;
DROP POLICY IF EXISTS "Users can join or Managers can add members" ON mess_members;

CREATE POLICY "Users can join or Managers can add members" ON mess_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR
  is_mess_manager(mess_id)
);


-- 3. FIX RLS FOR MEALS (Allow Managers OR Permitted Members)
DROP POLICY IF EXISTS "Managers can manage meals" ON meals;
DROP POLICY IF EXISTS "Managers or permitted members can manage meals" ON meals;

CREATE POLICY "Managers or permitted members can manage meals" ON meals
FOR ALL USING (
  exists (
    select 1 from months m
    join mess_members mm on mm.mess_id = m.mess_id
    where m.id = meals.month_id
    and mm.user_id = auth.uid()
    and (mm.role = 'manager' OR mm.can_manage_meals = true)
    and mm.status = 'active'
  )
);


-- 4. FIX RLS FOR DEPOSITS (Allow Managers OR Permitted Members)
DROP POLICY IF EXISTS "Managers can manage deposits" ON deposits;
DROP POLICY IF EXISTS "Managers or permitted members can manage deposits" ON deposits;

CREATE POLICY "Managers or permitted members can manage deposits" ON deposits
FOR ALL USING (
  exists (
    select 1 from months m
    join mess_members mm on mm.mess_id = m.mess_id
    where m.id = deposits.month_id
    and mm.user_id = auth.uid()
    and (mm.role = 'manager' OR mm.can_manage_finance = true)
    and mm.status = 'active'
  )
);


-- 5. FIX RLS FOR EXPENSES (Allow Managers OR Permitted Members)
DROP POLICY IF EXISTS "Managers can manage expenses" ON expenses;
DROP POLICY IF EXISTS "Managers or permitted members can manage expenses" ON expenses;

CREATE POLICY "Managers or permitted members can manage expenses" ON expenses
FOR ALL USING (
  exists (
    select 1 from months m
    join mess_members mm on mm.mess_id = m.mess_id
    where m.id = expenses.month_id
    and mm.user_id = auth.uid()
    and (mm.role = 'manager' OR mm.can_manage_finance = true)
    and mm.status = 'active'
  )
);
