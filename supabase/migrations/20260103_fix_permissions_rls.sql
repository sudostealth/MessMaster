-- Fix RLS for Meals
drop policy if exists "Managers can manage meals" on meals;
create policy "Managers can manage meals"
  on meals
  for all
  using (
    exists (
      select 1 from mess_members mm
      join months m on m.mess_id = mm.mess_id
      where m.id = meals.month_id
      and mm.user_id = auth.uid()
      and (mm.role = 'manager' or mm.can_manage_meals = true)
    )
  );

-- Fix RLS for Deposits
drop policy if exists "Managers can manage deposits" on deposits;
create policy "Managers can manage deposits"
  on deposits
  for all
  using (
    exists (
      select 1 from mess_members mm
      join months m on m.mess_id = mm.mess_id
      where m.id = deposits.month_id
      and mm.user_id = auth.uid()
      and (mm.role = 'manager' or mm.can_manage_finance = true)
    )
  );

-- Fix RLS for Expenses
drop policy if exists "Managers can manage expenses" on expenses;
create policy "Managers can manage expenses"
  on expenses
  for all
  using (
    exists (
      select 1 from mess_members mm
      join months m on m.mess_id = mm.mess_id
      where m.id = expenses.month_id
      and mm.user_id = auth.uid()
      and (mm.role = 'manager' or mm.can_manage_finance = true)
    )
  );

-- Fix RLS for Expense Allocations
drop policy if exists "Managers can manage allocations" on expense_allocations;
create policy "Managers can manage allocations"
  on expense_allocations
  for all
  using (
    exists (
      select 1 from expenses e
      join months m on m.id = e.month_id
      join mess_members mm on mm.mess_id = m.mess_id
      where e.id = expense_allocations.expense_id
      and mm.user_id = auth.uid()
      and (mm.role = 'manager' or mm.can_manage_finance = true)
    )
  );

-- Fix RLS for Mess Members (Allowing members with can_manage_members to add/update/delete)
-- Note: Limiting updates to ensure they can't promote themselves to manager is handled by application logic usually,
-- but strictly RLS here just checks if they have permission to touch the table.
drop policy if exists "Managers can manage mess members" on mess_members;
create policy "Managers can manage mess members"
  on mess_members
  for all
  using (
    exists (
      select 1 from mess_members mm
      where mm.mess_id = mess_members.mess_id
      and mm.user_id = auth.uid()
      and (mm.role = 'manager' or mm.can_manage_members = true)
    )
  );
