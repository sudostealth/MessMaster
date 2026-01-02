-- Add permissions columns to mess_members
ALTER TABLE mess_members
ADD COLUMN IF NOT EXISTS can_manage_meals boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_finance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_members boolean DEFAULT false;

-- Add ON DELETE CASCADE to foreign keys to fix deletion issues

-- First drop existing constraints if they exist (names inferred from standard naming or schema)
-- mess_members
ALTER TABLE mess_members DROP CONSTRAINT IF EXISTS mess_members_mess_id_fkey;
ALTER TABLE mess_members
  ADD CONSTRAINT mess_members_mess_id_fkey
  FOREIGN KEY (mess_id)
  REFERENCES messes(id)
  ON DELETE CASCADE;

-- notices
ALTER TABLE notices DROP CONSTRAINT IF EXISTS notices_mess_id_fkey;
ALTER TABLE notices
  ADD CONSTRAINT notices_mess_id_fkey
  FOREIGN KEY (mess_id)
  REFERENCES messes(id)
  ON DELETE CASCADE;

-- months
ALTER TABLE months DROP CONSTRAINT IF EXISTS months_mess_id_fkey;
ALTER TABLE months
  ADD CONSTRAINT months_mess_id_fkey
  FOREIGN KEY (mess_id)
  REFERENCES messes(id)
  ON DELETE CASCADE;

-- meals (depends on months)
ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_month_id_fkey;
ALTER TABLE meals
  ADD CONSTRAINT meals_month_id_fkey
  FOREIGN KEY (month_id)
  REFERENCES months(id)
  ON DELETE CASCADE;

-- deposits (depends on months)
ALTER TABLE deposits DROP CONSTRAINT IF EXISTS deposits_month_id_fkey;
ALTER TABLE deposits
  ADD CONSTRAINT deposits_month_id_fkey
  FOREIGN KEY (month_id)
  REFERENCES months(id)
  ON DELETE CASCADE;

-- expenses (depends on months)
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_month_id_fkey;
ALTER TABLE expenses
  ADD CONSTRAINT expenses_month_id_fkey
  FOREIGN KEY (month_id)
  REFERENCES months(id)
  ON DELETE CASCADE;

-- expense_allocations (depends on expenses)
ALTER TABLE expense_allocations DROP CONSTRAINT IF EXISTS expense_allocations_expense_id_fkey;
ALTER TABLE expense_allocations
  ADD CONSTRAINT expense_allocations_expense_id_fkey
  FOREIGN KEY (expense_id)
  REFERENCES expenses(id)
  ON DELETE CASCADE;
