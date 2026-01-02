-- Consolidated Migration: Roles Update & RLS Recursion Fix

-- ==========================================
-- 1. SCHEMA UPDATE: PROFILES & ROLES
-- ==========================================
-- Update Profiles Role Constraint and Default
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'manager', 'member', 'user'));
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- Data Migration
-- Set 'user' for profiles who are NOT in any mess
UPDATE profiles
SET role = 'user'
WHERE role = 'member'
  AND id NOT IN (SELECT user_id FROM mess_members);


-- ==========================================
-- 2. RLS RECURSION FIX (DROP & RECREATE)
-- ==========================================
-- Drop functions CASCADE to remove all dependent policies cleanly
DROP FUNCTION IF EXISTS is_mess_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_mess_manager(uuid) CASCADE;

-- Re-create Helper Functions with SECURITY DEFINER
-- IMPORTANT: SECURITY DEFINER means this function runs with the privileges of the creator (postgres/admin),
-- bypassing RLS on the tables it queries (mess_members). This breaks the recursion loop.
CREATE OR REPLACE FUNCTION is_mess_member(_mess_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mess_members
    WHERE mess_id = _mess_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_mess_manager(_mess_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mess_members
    WHERE mess_id = _mess_id
    AND user_id = auth.uid()
    AND role = 'manager'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==========================================
-- 3. RECREATE ALL DROPPED POLICIES
-- ==========================================

-- 3a. MESS MEMBERS
CREATE POLICY "View members of own mess"
  ON mess_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_mess_member(mess_id)
  );

CREATE POLICY "Users can join a mess"
  ON mess_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update members"
  ON mess_members FOR UPDATE
  USING (is_mess_manager(mess_id));

CREATE POLICY "Managers can remove members or users leave"
  ON mess_members FOR DELETE
  USING (
    user_id = auth.uid() OR is_mess_manager(mess_id)
  );

-- 3b. MESSES
-- (Drop explicitly just in case CASCADE didn't catch it because it's not a direct dependency on the function itself but usually is)
DROP POLICY IF EXISTS "Managers can update mess details" ON messes;
CREATE POLICY "Managers can update mess details"
  on messes for update
  using (
    created_by = auth.uid() OR is_mess_manager(id)
  );

-- 3c. MONTHS
CREATE POLICY "View months of joined mess"
  on months for select
  using (is_mess_member(mess_id));

CREATE POLICY "Managers can manage months"
  on months for all
  using (is_mess_manager(mess_id));

-- 3d. MEALS
CREATE POLICY "View meals of joined mess"
  on meals for select
  using (
    exists (
      select 1 from months
      where months.id = meals.month_id
      and is_mess_member(months.mess_id)
    )
  );

CREATE POLICY "Managers can manage meals"
  on meals for all
  using (
    exists (
      select 1 from months
      where months.id = meals.month_id
      and is_mess_manager(months.mess_id)
    )
  );

-- 3e. DEPOSITS
CREATE POLICY "View deposits of joined mess"
  on deposits for select
  using (
    exists (
      select 1 from months
      where months.id = deposits.month_id
      and is_mess_member(months.mess_id)
    )
  );

CREATE POLICY "Managers can manage deposits"
  on deposits for all
  using (
    exists (
      select 1 from months
      where months.id = deposits.month_id
      and is_mess_manager(months.mess_id)
    )
  );

-- 3f. EXPENSES
CREATE POLICY "View expenses of joined mess"
  on expenses for select
  using (
    exists (
      select 1 from months
      where months.id = expenses.month_id
      and is_mess_member(months.mess_id)
    )
  );

CREATE POLICY "Managers can manage expenses"
  on expenses for all
  using (
    exists (
      select 1 from months
      where months.id = expenses.month_id
      and is_mess_manager(months.mess_id)
    )
  );

-- 3g. EXPENSE ALLOCATIONS
CREATE POLICY "View allocations of joined mess"
  on expense_allocations for select
  using (
    exists (
      select 1 from expenses e
      join months m on m.id = e.month_id
      where e.id = expense_allocations.expense_id
      and is_mess_member(m.mess_id)
    )
  );

CREATE POLICY "Managers can manage allocations"
  on expense_allocations for all
  using (
    exists (
      select 1 from expenses e
      join months m on m.id = e.month_id
      where e.id = expense_allocations.expense_id
      and is_mess_manager(m.mess_id)
    )
  );

-- 3h. NOTICES
CREATE POLICY "View notices of joined mess"
  on notices for select
  using (is_mess_member(mess_id));

CREATE POLICY "Managers can manage notices"
  on notices for all
  using (is_mess_manager(mess_id));
