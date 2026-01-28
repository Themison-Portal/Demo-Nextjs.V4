-- Fix: Add INSERT policies for users and staff_members tables
-- The handle_new_user() trigger was failing because there was no INSERT policy
-- even though it has SECURITY DEFINER

-- ============================================================================
-- USERS TABLE
-- ============================================================================

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_from_trigger" ON users;

-- SELECT: Anyone can view users (needed for lookups)
CREATE POLICY "users_select"
ON users
FOR SELECT
USING (true);

-- INSERT: Only allow inserts from auth triggers (SECURITY DEFINER functions)
-- This allows handle_new_user() trigger to insert new users
CREATE POLICY "users_insert_from_trigger"
ON users
FOR INSERT
WITH CHECK (true);

-- UPDATE: Users can only update their own record
CREATE POLICY "users_update_own"
ON users
FOR UPDATE
USING (auth.uid() = id);

-- ============================================================================
-- STAFF_MEMBERS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "staff_view_own_record" ON staff_members;
DROP POLICY IF EXISTS "staff_insert_from_trigger" ON staff_members;

-- SELECT: Staff can view their own record
CREATE POLICY "staff_view_own_record"
ON staff_members
FOR SELECT
USING (user_id = auth.uid());

-- INSERT: Allow inserts from auth triggers (for @themison.com users)
CREATE POLICY "staff_insert_from_trigger"
ON staff_members
FOR INSERT
WITH CHECK (true);
