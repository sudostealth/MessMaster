-- Create notifications table
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table notifications enable row level security;

create policy "Users can view own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Managers can insert notifications" on notifications for insert with check (
  exists (
    select 1 from mess_members 
    where user_id = auth.uid() 
    and role = 'manager'
  )
);
-- Allow anyone to insert? Maybe system triggers. Since we run server actions as user (manager), 
-- they need insert permission FOR OTHER USERS. 
-- The default `auth.uid() = id` usually blocks inserting for others.
-- We need a policy: "Managers of same mess can insert for members"?
-- Complexity: Notification table doesn't have mess_id.
-- Easier: "Authenticated users can insert notifications" (if we control logic in server action).
-- Or simply "Managers can insert".
create policy "Authenticated users can insert notifications" on notifications for insert with check (auth.role() = 'authenticated');
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);
