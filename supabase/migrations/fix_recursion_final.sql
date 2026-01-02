-- Aggressive cleanup of RLS to fix recursion
-- 1. Drop potentially recursive functions explicitly
DROP FUNCTION IF EXISTS is_mess_member(uuid);
DROP FUNCTION IF EXISTS is_mess_manager(uuid);

-- 2. Drop ALL policies on mess_members to ensure clean slate
DROP POLICY IF EXISTS "View members of own mess" ON mess_members;
DROP POLICY IF EXISTS "Users can join a mess" ON mess_members;
DROP POLICY IF EXISTS "Managers can update members" ON mess_members;
DROP POLICY IF EXISTS "Managers can remove members or users leave" ON mess_members;
DROP POLICY IF EXISTS "Managers can delete members" ON mess_members; -- Potential alias
DROP POLICY IF EXISTS "Authenticated users can insert mess_members" ON mess_members;
-- Also drop any potentially auto-generated or older policies
DROP POLICY IF EXISTS "Enable read access for members" ON mess_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON mess_members;

-- 3. Re-create Helper Functions with SECURITY DEFINER
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

-- 4. Re-apply Policies on mess_members

-- SELECT: Users can see members if they are in the same mess.
-- Optimized: Short-circuit if looking at own record to avoid function call overhead.
CREATE POLICY "View members of own mess"
  ON mess_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_mess_member(mess_id)
  );

-- INSERT: Users can only insert THEMSELVES (Create/Join).
-- This simple check avoids recursion because it doesn't query the table.
CREATE POLICY "Users can join a mess"
  ON mess_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Managers can update members (e.g. approve/reject/promote).
CREATE POLICY "Managers can update members"
  ON mess_members FOR UPDATE
  USING (is_mess_manager(mess_id));

-- DELETE: Managers can remove members, OR users can leave (remove themselves).
CREATE POLICY "Managers can remove members or users leave"
  ON mess_members FOR DELETE
  USING (
    user_id = auth.uid() OR is_mess_manager(mess_id)
  );
