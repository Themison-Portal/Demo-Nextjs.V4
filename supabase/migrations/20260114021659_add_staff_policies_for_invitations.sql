-- Create is_staff() function for console access
-- Staff should have full access in console regardless of support_enabled
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get current user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Check if staff member (active)
  IF user_email LIKE '%@themison.com' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.staff_members sm
      JOIN public.users u ON u.id = sm.user_id
      WHERE u.email = user_email
        AND sm.status = 'active'
    );
  END IF;

  RETURN FALSE;
END;
$$;

-- Update invitations policies to allow full staff access
-- Staff can view all invitations (console access)
DROP POLICY IF EXISTS "invitations_view" ON invitations;
CREATE POLICY "invitations_view" ON invitations FOR SELECT
  USING (is_org_admin(org_id) OR is_staff());

-- Staff can insert invitations to any org (console access)
DROP POLICY IF EXISTS "invitations_insert" ON invitations;
CREATE POLICY "invitations_insert" ON invitations FOR INSERT
  WITH CHECK (is_org_admin(org_id) OR is_staff());

-- Staff can update invitations (console access)
DROP POLICY IF EXISTS "invitations_update" ON invitations;
CREATE POLICY "invitations_update" ON invitations FOR UPDATE
  USING (is_org_admin(org_id) OR is_staff());
