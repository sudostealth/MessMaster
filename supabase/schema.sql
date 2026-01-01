-- Create tables for Mess Master

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users not null primary key,
  name text not null,
  phone text,
  email text,
  role text default 'member' check (role in ('admin', 'manager', 'member')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MESSES
create table messes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references profiles(id) not null,
  code text unique not null, -- For joining
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MESS MEMBERS
create table mess_members (
  id uuid default uuid_generate_v4() primary key,
  mess_id uuid references messes(id) not null,
  user_id uuid references profiles(id) not null,
  role text default 'member' check (role in ('manager', 'member')),
  status text default 'pending' check (status in ('active', 'pending', 'rejected')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(mess_id, user_id)
);

-- MONTHS (Accounting Periods)
create table months (
  id uuid default uuid_generate_v4() primary key,
  mess_id uuid references messes(id) not null,
  name text not null, -- "January 2024"
  start_date date not null,
  end_date date,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MEALS
create table meals (
  id uuid default uuid_generate_v4() primary key,
  month_id uuid references months(id) not null,
  user_id uuid references profiles(id) not null,
  date date not null,
  breakfast numeric default 0,
  lunch numeric default 0,
  dinner numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DEPOSITS
create table deposits (
  id uuid default uuid_generate_v4() primary key,
  month_id uuid references months(id) not null,
  user_id uuid references profiles(id) not null, -- Member who deposited
  added_by uuid references profiles(id) not null, -- Manager who recorded it
  amount numeric not null,
  date date not null,
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EXPENSES (Unified table for all costs)
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  month_id uuid references months(id) not null,
  added_by uuid references profiles(id) not null,
  amount numeric not null,
  date date not null,
  category text not null check (category in ('meal', 'shared', 'individual')),
  details text,
  shopper_id uuid references profiles(id), -- For 'meal' category (marketing)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EXPENSE ALLOCATIONS (For shared/individual cost distribution)
-- If category is 'meal', this table might be empty (as it applies to the global rate),
-- or it could store 0 if we rely on dynamic calc. 
-- For 'shared', this stores the split amount per member.
-- For 'individual', this stores the full amount for that member.
create table expense_allocations (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTICES
create table notices (
  id uuid default uuid_generate_v4() primary key,
  mess_id uuid references messes(id) not null,
  title text not null,
  content text not null,
  created_by uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Row Level Security)
alter table profiles enable row level security;
alter table messes enable row level security;
alter table mess_members enable row level security;
alter table months enable row level security;
alter table meals enable row level security;
alter table deposits enable row level security;
alter table expenses enable row level security;
alter table expense_allocations enable row level security;
alter table notices enable row level security;

-- Basic Policy: Users can view their own data and data of messes they belong to.
-- Simplified for initial setup (open read for authenticated users, restrictive write).

create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (new.id, new.raw_user_meta_data->>'name', new.email, new.raw_user_meta_data->>'phone');
  return new;
end;
$$ language plpgsql security definer;

  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- NOTIFICATIONS
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notifications enable row level security;
create policy "Users can view own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Authenticated users can insert notifications" on notifications for insert with check (auth.role() = 'authenticated');
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);
