-- Fix handle_new_user trigger to copy first_name and last_name from user_metadata
-- The signup flow stores these in raw_user_meta_data but the trigger wasn't copying them

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create user mirror with name from user_metadata
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    updated_at = NOW();

  -- If @themison.com AND email confirmed → create staff
  IF NEW.email LIKE '%@themison.com' AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.staff_members (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
