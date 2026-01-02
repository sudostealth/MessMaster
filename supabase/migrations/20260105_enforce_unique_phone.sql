-- Enforce unique phone number in profiles table
alter table public.profiles
add constraint profiles_phone_key unique (phone);

-- Update handle_new_user function to copy phone from metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;
