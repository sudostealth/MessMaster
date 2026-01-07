-- FIX EMAIL SYNC
-- This trigger ensures that when a user's email is updated in auth.users (e.g., after email change confirmation),
-- the change is automatically reflected in public.profiles.

CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated_email ON auth.users;
CREATE TRIGGER on_auth_user_updated_email
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE PROCEDURE public.sync_user_email();
