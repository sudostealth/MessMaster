-- FIX SCRIPT V5: Account Deletion Support
-- Run this in your Supabase SQL Editor.

-- 1. EXPENSES: Allow NULL for user references and Set Null on Delete
ALTER TABLE expenses ALTER COLUMN added_by DROP NOT NULL;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_added_by_fkey;
ALTER TABLE expenses ADD CONSTRAINT expenses_added_by_fkey FOREIGN KEY (added_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE expenses ALTER COLUMN shopper_id DROP NOT NULL;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_shopper_id_fkey;
ALTER TABLE expenses ADD CONSTRAINT expenses_shopper_id_fkey FOREIGN KEY (shopper_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. DEPOSITS: Allow NULL and Set Null on Delete
ALTER TABLE deposits ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE deposits DROP CONSTRAINT IF EXISTS deposits_user_id_fkey;
ALTER TABLE deposits ADD CONSTRAINT deposits_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE deposits ALTER COLUMN added_by DROP NOT NULL;
ALTER TABLE deposits DROP CONSTRAINT IF EXISTS deposits_added_by_fkey;
ALTER TABLE deposits ADD CONSTRAINT deposits_added_by_fkey FOREIGN KEY (added_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. MEALS: Delete meals if user deleted (Cascade)
ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_user_id_fkey;
ALTER TABLE meals ADD CONSTRAINT meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE meals ALTER COLUMN added_by DROP NOT NULL;
ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_added_by_fkey;
ALTER TABLE meals ADD CONSTRAINT meals_added_by_fkey FOREIGN KEY (added_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. MESS MEMBERS: Delete membership if user deleted (Cascade)
ALTER TABLE mess_members DROP CONSTRAINT IF EXISTS mess_members_user_id_fkey;
ALTER TABLE mess_members ADD CONSTRAINT mess_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. NOTIFICATIONS: Delete notifications if user deleted (Cascade)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 6. EXPENSE ALLOCATIONS: Delete allocation if user deleted (Cascade? Or Set Null?)
-- If allocated user is gone, debt is gone? Yes, usually.
ALTER TABLE expense_allocations DROP CONSTRAINT IF EXISTS expense_allocations_user_id_fkey;
ALTER TABLE expense_allocations ADD CONSTRAINT expense_allocations_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 7. PROFILES: Ensure profile is deleted when auth.user is deleted (Cascade)
-- (Usually automatic if defined as REFERENCES auth.users ON DELETE CASCADE)
-- We can't easily alter the primary key constraint here without dropping it, but standard Supabase setup does NOT cascade by default.
-- However, we are triggering deletion via Admin API which deletes auth.user.
-- We need a trigger on auth.users deletion to delete public.profiles?
-- OR we ensure profiles.id foreign key has cascade.
-- Let's check if we can alter it.
-- ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- This is often restricted on Supabase.
-- Alternative: We manually delete from public.profiles in the Server Action (using Service Role).
