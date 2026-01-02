-- 1. Update Profiles Role Constraint and Default
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'manager', 'member', 'user'));
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- 2. Data Migration
-- Set 'user' for profiles who are NOT in any mess (and not admin/manager if we assume only creators are managers)
-- Actually, strict logic: If not in mess_members, role should be 'user'.
-- But we should preserve 'admin' if it exists.
UPDATE profiles
SET role = 'user'
WHERE role = 'member'
  AND id NOT IN (SELECT user_id FROM mess_members);

-- 3. Fix Infinite Recursion in RLS
-- Redefine helper functions with SECURITY DEFINER to bypass RLS recursion
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

-- Update mess_members policies to explicitly break recursion if necessary
-- With SECURITY DEFINER functions above, the recursion should be broken because the function runs with owner privileges (bypassing the table RLS for the SELECT inside it).
-- However, we should ensure the policies use these functions or simple checks.

-- Drop existing problematic policy
DROP POLICY IF EXISTS "View members of own mess" ON mess_members;

-- Re-create policy using the secure function (or simpler logic if possible)
-- Logic: User can see if they ARE the user OR if they are in the same mess.
CREATE POLICY "View members of own mess"
  ON mess_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_mess_member(mess_id)
  );

-- Ensure other policies use the functions correctly
DROP POLICY IF EXISTS "Managers can update members" ON mess_members;
CREATE POLICY "Managers can update members"
  ON mess_members FOR UPDATE
  USING (is_mess_manager(mess_id));

DROP POLICY IF EXISTS "Managers can remove members or users leave" ON mess_members;
CREATE POLICY "Managers can remove members or users leave"
  ON mess_members FOR DELETE
  USING (
    user_id = auth.uid() OR is_mess_manager(mess_id)
  );
