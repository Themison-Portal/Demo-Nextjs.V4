-- Fix recursive RLS policies
-- Problem: Policies were calling functions that query the same tables, causing infinite recursion

-- ======================
-- ORGANIZATIONS TABLE
-- ======================

-- Drop old recursive policies
DROP POLICY IF EXISTS "orgs_staff_view_all" ON organizations;
DROP POLICY IF EXISTS "orgs_staff_insert" ON organizations;
DROP POLICY IF EXISTS "orgs_staff_update" ON organizations;

-- Staff can view ALL organizations (no support_enabled check needed for listing)
-- Support check happens in middleware when accessing org data
CREATE POLICY "orgs_staff_view_all"
ON organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Staff can insert organizations
CREATE POLICY "orgs_staff_insert"
ON organizations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Staff can update organizations (toggle support, etc)
CREATE POLICY "orgs_staff_update"
ON organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM staff_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Org members can view their organization (existing policy - keep it)
-- This one is fine, no recursion

-- Superadmin can update org (existing policy - keep it)
-- This one is fine, no recursion


-- ======================
-- ORGANIZATION_MEMBERS TABLE
-- ======================

-- Drop old recursive policy
DROP POLICY IF EXISTS "org_members_view" ON organization_members;

-- Recreate without recursion
CREATE POLICY "org_members_view"
ON organization_members
FOR SELECT
USING (
  -- Staff can view all
  EXISTS (
    SELECT 1 FROM staff_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
  OR
  -- Can view own membership record
  user_id = auth.uid()
);

-- Note: For viewing OTHER members in same org, application layer handles it
-- Admin/superadmin policies for insert/update/delete remain unchanged

COMMENT ON POLICY "orgs_staff_view_all" ON organizations IS
'Staff can view all orgs for listing in console. Support check happens in middleware.';

COMMENT ON POLICY "org_members_view" ON organization_members IS
'Staff can view all members. Users can view their own membership record.';
