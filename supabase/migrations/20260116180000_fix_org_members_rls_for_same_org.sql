-- Fix: Allow org members to view other members in their same organization
-- Problem: Only staff or self could see members, org admins couldn't see their team
-- Solution: Use SECURITY DEFINER function to bypass RLS when checking membership

-- Drop old policy
DROP POLICY IF EXISTS "org_members_view" ON organization_members;

-- Create helper function that bypasses RLS to get user's org_ids
-- SECURITY DEFINER runs with the privileges of the function owner (postgres)
CREATE OR REPLACE FUNCTION get_user_org_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id
  FROM organization_members
  WHERE user_id = p_user_id
  AND deleted_at IS NULL;
$$;

-- Recreate policy using the helper function (no recursion)
CREATE POLICY "org_members_view"
ON organization_members
FOR SELECT
USING (
  -- Staff can view all members
  EXISTS (
    SELECT 1 FROM staff_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
  OR
  -- User can view members in orgs where they are a member
  -- Uses SECURITY DEFINER function to avoid recursion
  org_id IN (SELECT get_user_org_ids(auth.uid()))
);

COMMENT ON POLICY "org_members_view" ON organization_members IS
'Staff can view all members. Org members can view other members in their same org (via SECURITY DEFINER function).';
