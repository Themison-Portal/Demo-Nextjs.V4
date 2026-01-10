-- BUG-004: Fix staff_members trigger to handle email confirmation
-- Problem: Trigger only fires on INSERT, but email_confirmed_at is set on UPDATE
-- Solution: Listen to both INSERT and UPDATE events

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger to listen to both INSERT and UPDATE
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
