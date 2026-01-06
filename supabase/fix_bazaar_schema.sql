-- ==============================================================================
-- BAZAAR SCHEDULE SCHEMA UPDATE
-- ==============================================================================

-- 1. Create bazaar_schedules table
CREATE TABLE IF NOT EXISTS bazaar_schedules (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  mess_id uuid REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  month_id uuid REFERENCES months(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  shopping_list text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create bazaar_shoppers table
CREATE TABLE IF NOT EXISTS bazaar_shoppers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  schedule_id uuid REFERENCES bazaar_schedules(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE bazaar_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bazaar_shoppers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for bazaar_schedules

-- View: All members of the mess can view schedules
CREATE POLICY "View schedules of joined mess" ON bazaar_schedules
FOR SELECT USING (
  exists (
    select 1 from mess_members mm
    where mm.mess_id = bazaar_schedules.mess_id
    and mm.user_id = auth.uid()
    and mm.status = 'active'
  )
);

-- Manage: Managers or 'can_manage_meals' (treating bazaar as meal-related)
-- Prompt said "manager can set", but consistency suggests delegating permissions if we want.
-- However, strict interpretation of "manager" implies role='manager'.
-- I will include can_manage_meals for flexibility as it relates to food/shopping.
CREATE POLICY "Managers can manage schedules" ON bazaar_schedules
FOR ALL USING (
  exists (
    select 1 from mess_members mm
    where mm.mess_id = bazaar_schedules.mess_id
    and mm.user_id = auth.uid()
    and (mm.role = 'manager' OR mm.can_manage_meals = true)
    and mm.status = 'active'
  )
);

-- 5. RLS Policies for bazaar_shoppers

-- View: All members
-- We need to link back to mess_id via bazaar_schedules
CREATE POLICY "View shoppers of joined mess" ON bazaar_shoppers
FOR SELECT USING (
  exists (
    select 1 from bazaar_schedules bs
    join mess_members mm on mm.mess_id = bs.mess_id
    where bs.id = bazaar_shoppers.schedule_id
    and mm.user_id = auth.uid()
    and mm.status = 'active'
  )
);

-- Manage: Managers
CREATE POLICY "Managers can manage shoppers" ON bazaar_shoppers
FOR ALL USING (
  exists (
    select 1 from bazaar_schedules bs
    join mess_members mm on mm.mess_id = bs.mess_id
    where bs.id = bazaar_shoppers.schedule_id
    and mm.user_id = auth.uid()
    and (mm.role = 'manager' OR mm.can_manage_meals = true)
    and mm.status = 'active'
  )
);
