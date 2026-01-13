-- Fix infinite recursion in staff_members policy
-- The policy was referencing itself, creating an infinite loop

-- Drop the recursive policy
DROP POLICY IF EXISTS "staff_view_all" ON staff_members;

-- Create a simple policy: staff members can view their own record
-- No recursion - just direct comparison with auth.uid()
CREATE POLICY "staff_view_own_record"
ON staff_members
FOR SELECT
USING (user_id = auth.uid());
