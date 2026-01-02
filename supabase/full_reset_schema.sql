-- ==============================================================================
-- MESS MASTER FULL DATABASE RESET & INIT SCRIPT
-- ==============================================================================
-- WARNING: Running this script will DELETE ALL DATA in the application tables.
-- It recreates the schema from scratch with the latest fixes and security updates.
-- ==============================================================================

-- 1. DROP EVERYTHING (Clean Slate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS is_mess_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_mess_manager(uuid) CASCADE;
DROP FUNCTION IF EXISTS sync_mess_member_role() CASCADE;

-- Drop Tables (Order matters due to foreign keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS expense_allocations CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS months CASCADE;
DROP TABLE IF EXISTS mess_members CASCADE;
DROP TABLE IF EXISTS messes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ==============================================================================
-- 2. CREATE TABLES
-- ==============================================================================

-- 2.1 PROFILES (Users)
-- Updated: Default role 'user', allow 'user' in check constraint
CREATE TABLE profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'member', 'user')),
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 MESSES
CREATE TABLE messes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  code text UNIQUE NOT NULL, -- For joining
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3 MESS MEMBERS
CREATE TABLE mess_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  mess_id uuid REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('manager', 'member')),
  status text DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
  can_manage_meals boolean DEFAULT false,
  can_manage_finance boolean DEFAULT false,
  can_manage_members boolean DEFAULT false,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(mess_id, user_id)
);

-- 2.4 MONTHS (Accounting Periods)
CREATE TABLE months (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  mess_id uuid REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- "January 2024"
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.5 MEALS
CREATE TABLE meals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  month_id uuid REFERENCES months(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  date date NOT NULL,
  breakfast numeric DEFAULT 0,
  lunch numeric DEFAULT 0,
  dinner numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.6 DEPOSITS
CREATE TABLE deposits (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  month_id uuid REFERENCES months(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL, -- Member who deposited
  added_by uuid REFERENCES profiles(id) NOT NULL, -- Manager who recorded it
  amount numeric NOT NULL,
  date date NOT NULL,
  details text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.7 EXPENSES (Unified table for all costs)
CREATE TABLE expenses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  month_id uuid REFERENCES months(id) ON DELETE CASCADE NOT NULL,
  added_by uuid REFERENCES profiles(id) NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL,
  category text NOT NULL CHECK (category IN ('meal', 'shared', 'individual')),
  details text,
  shopper_id uuid REFERENCES profiles(id), -- For 'meal' category (marketing)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.8 EXPENSE ALLOCATIONS
CREATE TABLE expense_allocations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.9 NOTICES
CREATE TABLE notices (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  mess_id uuid REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.10 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  mess_id uuid, -- Optional link to mess (added based on logic)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- 3. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 3.1 Handle New User Trigger
-- Updated: Ensure default role is 'user' (handled by DB default, but explicit here is fine)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'phone',
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3.2 RLS Helper Functions (Recursion Fix)
-- IMPORTANT: SECURITY DEFINER with search_path=public to bypass RLS recursion
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


-- 3.3 SYNC PROFILE ROLES TRIGGER (The Automator)
-- This function ensures profiles.role is always in sync with mess_members
CREATE OR REPLACE FUNCTION sync_mess_member_role()
RETURNS trigger AS $$
BEGIN
  -- CASE: User Joined or Updated (Promoted/Demoted)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- If status is active or pending? Usually pending members are 'member'.
    -- We'll sync the role defined in mess_members to the profile.
    -- If pending, they are technically 'member' contextually, but maybe globally 'user'?
    -- Requirement: "when a user join... user's role will be 'member'" (implies upon request)
    UPDATE public.profiles
    SET role = NEW.role
    WHERE id = NEW.user_id;
    RETURN NEW;

  -- CASE: User Left or Removed
  ELSIF (TG_OP = 'DELETE') THEN
    -- Revert to 'user'
    UPDATE public.profiles
    SET role = 'user'
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_mess_member_change
  AFTER INSERT OR UPDATE OR DELETE ON mess_members
  FOR EACH ROW EXECUTE PROCEDURE sync_mess_member_role();


-- ==============================================================================
-- 4. ENABLE RLS & POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mess_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE months ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;


-- 4.1 PROFILES
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Note: Trigger updates bypass RLS, so this policy is just for the user editing their own name/avatar.
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 4.2 MESSES
CREATE POLICY "Authenticated users can view messes" ON messes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create messes" ON messes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Managers can update mess details" ON messes FOR UPDATE USING (created_by = auth.uid() OR is_mess_manager(id));
CREATE POLICY "Managers can delete mess" ON messes FOR DELETE USING (created_by = auth.uid() OR is_mess_manager(id));

-- 4.3 MESS MEMBERS
CREATE POLICY "View members of own mess" ON mess_members FOR SELECT USING (user_id = auth.uid() OR is_mess_member(mess_id));
CREATE POLICY "Users can join a mess" ON mess_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers can update members" ON mess_members FOR UPDATE USING (is_mess_manager(mess_id));
CREATE POLICY "Managers can remove members or users leave" ON mess_members FOR DELETE USING (user_id = auth.uid() OR is_mess_manager(mess_id));

-- 4.4 MONTHS
CREATE POLICY "View months of joined mess" ON months FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY "Managers can manage months" ON months FOR ALL USING (is_mess_manager(mess_id));

-- 4.5 MEALS
CREATE POLICY "View meals of joined mess" ON meals FOR SELECT USING (exists (select 1 from months where months.id = meals.month_id and is_mess_member(months.mess_id)));
CREATE POLICY "Managers can manage meals" ON meals FOR ALL USING (exists (select 1 from months where months.id = meals.month_id and is_mess_manager(months.mess_id)));

-- 4.6 DEPOSITS
CREATE POLICY "View deposits of joined mess" ON deposits FOR SELECT USING (exists (select 1 from months where months.id = deposits.month_id and is_mess_member(months.mess_id)));
CREATE POLICY "Managers can manage deposits" ON deposits FOR ALL USING (exists (select 1 from months where months.id = deposits.month_id and is_mess_manager(months.mess_id)));

-- 4.7 EXPENSES
CREATE POLICY "View expenses of joined mess" ON expenses FOR SELECT USING (exists (select 1 from months where months.id = expenses.month_id and is_mess_member(months.mess_id)));
CREATE POLICY "Managers can manage expenses" ON expenses FOR ALL USING (exists (select 1 from months where months.id = expenses.month_id and is_mess_manager(months.mess_id)));

-- 4.8 EXPENSE ALLOCATIONS
CREATE POLICY "View allocations of joined mess" ON expense_allocations FOR SELECT USING (exists (select 1 from expenses e join months m on m.id = e.month_id where e.id = expense_allocations.expense_id and is_mess_member(m.mess_id)));
CREATE POLICY "Managers can manage allocations" ON expense_allocations FOR ALL USING (exists (select 1 from expenses e join months m on m.id = e.month_id where e.id = expense_allocations.expense_id and is_mess_manager(m.mess_id)));

-- 4.9 NOTICES
CREATE POLICY "View notices of joined mess" ON notices FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY "Managers can manage notices" ON notices FOR ALL USING (is_mess_manager(mess_id));

-- 4.10 NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);


-- ==============================================================================
-- 5. DATA REPAIR / BACKFILL
-- ==============================================================================
-- Restore profiles for any existing Auth Users who might have lost their profile
-- due to the table drop. This ensures existing logins still work.
INSERT INTO profiles (id, name, email, role, created_at)
SELECT
  id,
  coalesce(raw_user_meta_data->>'name', email) as name,
  email,
  'user' as role,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
