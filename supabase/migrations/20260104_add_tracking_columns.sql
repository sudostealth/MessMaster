-- Add mess_id and month_id to notifications for cascade deletion
alter table public.notifications
add column if not exists mess_id uuid references public.messes(id) on delete cascade,
add column if not exists month_id uuid references public.months(id) on delete cascade;

-- Add added_by to meals for tracking
alter table public.meals
add column if not exists added_by uuid references public.profiles(id);

-- Add added_by to expenses and deposits if not exists (though deposits might have it, let's ensure)
-- Check schema: deposits has 'added_by' (Manager who recorded it).
-- Expenses has 'added_by'.
-- But we need to make sure RLS or other logic allows using it.
-- Actually, let's just ensure the columns exist.
alter table public.expenses
add column if not exists added_by uuid references public.profiles(id);

alter table public.deposits
add column if not exists added_by uuid references public.profiles(id);


-- Update RLS for notifications to allow managers to manage via mess_id?
-- The existing policies might need adjustment if we start filtering by mess_id.
-- For now, the delete actions will use service_role or manager checks so RLS on DELETE is fine if we have the right policies.
-- Let's ensure managers can DELETE notifications of their mess.
create policy "Managers can delete mess notifications"
  on notifications
  for delete
  using (
    exists (
      select 1 from mess_members mm
      where mm.mess_id = notifications.mess_id
      and mm.user_id = auth.uid()
      and mm.role = 'manager'
    )
  );
