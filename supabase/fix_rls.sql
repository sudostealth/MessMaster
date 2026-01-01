-- ==========================================
-- MESS MASTER ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Helper function to check if user is a member of the mess
create or replace function is_mess_member(_mess_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from mess_members
    where mess_id = _mess_id
    and user_id = auth.uid()
    and status = 'active'
  );
end;
$$ language plpgsql security definer;

-- Helper function to check if user is a manager of the mess
create or replace function is_mess_manager(_mess_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from mess_members
    where mess_id = _mess_id
    and user_id = auth.uid()
    and role = 'manager'
    and status = 'active'
  );
end;
$$ language plpgsql security definer;


-- 1. PROFILES
alter table profiles enable row level security;

-- Drop existing policies to avoid conflicts (both old and new names)
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Profiles are viewable by everyone" on profiles;
drop policy if exists "Users can check own profile existence" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Profiles are viewable by everyone" 
  on profiles for select 
  using (true);

create policy "Users can check own profile existence" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can insert their own profile" 
  on profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);


-- 2. MESSES
alter table messes enable row level security;
drop policy if exists "View messes if member or creator" on messes;
drop policy if exists "Authenticated users can create messes" on messes;
drop policy if exists "Managers can update mess details" on messes;

-- Visible if you are created it OR are a member
-- Visible to any authenticated user (needed for search/join)
create policy "Authenticated users can view messes" 
  on messes for select 
  using (auth.role() = 'authenticated');

-- Authenticated users can create a new mess
create policy "Authenticated users can create messes" 
  on messes for insert 
  with check (auth.role() = 'authenticated');

-- Only creator or manager can update
create policy "Managers can update mess details" 
  on messes for update 
  using (
    created_by = auth.uid() OR is_mess_manager(id)
  );


-- 3. MESS MEMBERS
alter table mess_members enable row level security;
drop policy if exists "View members of own mess" on mess_members;
drop policy if exists "Users can join a mess" on mess_members;
drop policy if exists "Managers can update members" on mess_members;
drop policy if exists "Managers can remove members or users leave" on mess_members;

-- Users can see memberships of messes they belong to (to see other members)
create policy "View members of own mess" 
  on mess_members for select 
  using (
    user_id = auth.uid() OR 
    is_mess_member(mess_id)
  );

-- Users can join (insert themselves as pending)
create policy "Users can join a mess" 
  on mess_members for insert 
  with check (auth.uid() = user_id);

-- Managers can update memberships (approve/reject/change role)
create policy "Managers can update members" 
  on mess_members for update 
  using (is_mess_manager(mess_id));

-- Managers can delete members (kick) or users can leave
create policy "Managers can remove members or users leave" 
  on mess_members for delete 
  using (
    user_id = auth.uid() OR is_mess_manager(mess_id)
  );


-- 4. MONTHS
alter table months enable row level security;
drop policy if exists "View months of joined mess" on months;
drop policy if exists "Managers can manage months" on months;

create policy "View months of joined mess" 
  on months for select 
  using (is_mess_member(mess_id));

create policy "Managers can manage months" 
  on months for all 
  using (is_mess_manager(mess_id));


-- 5. MEALS
alter table meals enable row level security;
drop policy if exists "View meals of joined mess" on meals;
drop policy if exists "Managers can manage meals" on meals;

-- Need to join with months to get mess_id
create policy "View meals of joined mess" 
  on meals for select 
  using (
    exists (
      select 1 from months 
      where months.id = meals.month_id 
      and is_mess_member(months.mess_id)
    )
  );

-- Managers can manage meals
create policy "Managers can manage meals" 
  on meals for all 
  using (
    exists (
      select 1 from months 
      where months.id = meals.month_id 
      and is_mess_manager(months.mess_id)
    )
  );


-- 6. DEPOSITS
alter table deposits enable row level security;
drop policy if exists "View deposits of joined mess" on deposits;
drop policy if exists "Managers can manage deposits" on deposits;

create policy "View deposits of joined mess" 
  on deposits for select 
  using (
    exists (
      select 1 from months 
      where months.id = deposits.month_id 
      and is_mess_member(months.mess_id)
    )
  );

create policy "Managers can manage deposits" 
  on deposits for all 
  using (
    exists (
      select 1 from months 
      where months.id = deposits.month_id 
      and is_mess_manager(months.mess_id)
    )
  );


-- 7. EXPENSES
alter table expenses enable row level security;
drop policy if exists "View expenses of joined mess" on expenses;
drop policy if exists "Managers can manage expenses" on expenses;

create policy "View expenses of joined mess" 
  on expenses for select 
  using (
    exists (
      select 1 from months 
      where months.id = expenses.month_id 
      and is_mess_member(months.mess_id)
    )
  );

create policy "Managers can manage expenses" 
  on expenses for all 
  using (
    exists (
      select 1 from months 
      where months.id = expenses.month_id 
      and is_mess_manager(months.mess_id)
    )
  );


-- 8. EXPENSE ALLOCATIONS
alter table expense_allocations enable row level security;
drop policy if exists "View allocations of joined mess" on expense_allocations;
drop policy if exists "Managers can manage allocations" on expense_allocations;

create policy "View allocations of joined mess" 
  on expense_allocations for select 
  using (
    exists (
      select 1 from expenses e
      join months m on m.id = e.month_id
      where e.id = expense_allocations.expense_id
      and is_mess_member(m.mess_id)
    )
  );

create policy "Managers can manage allocations" 
  on expense_allocations for all 
  using (
    exists (
      select 1 from expenses e
      join months m on m.id = e.month_id
      where e.id = expense_allocations.expense_id
      and is_mess_manager(m.mess_id)
    )
  );


-- 9. NOTICES
alter table notices enable row level security;
drop policy if exists "View notices of joined mess" on notices;
drop policy if exists "Managers can manage notices" on notices;

create policy "View notices of joined mess" 
  on notices for select 
  using (is_mess_member(mess_id));

create policy "Managers can manage notices" 
  on notices for all 
  using (is_mess_manager(mess_id));
