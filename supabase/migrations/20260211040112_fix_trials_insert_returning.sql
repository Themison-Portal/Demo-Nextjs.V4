-- Fix: INSERT...RETURNING on trials fails because trials_select policy
-- uses has_trial_access(id), which does a subquery joining the trials table.
-- The newly inserted row isn't visible to that subquery within the same statement.
--
-- Solution: add a SELECT policy that mirrors the INSERT check.
-- PostgreSQL OR's all SELECT policies, so this covers the RETURNING case
-- while has_trial_access covers the normal SELECT case.

CREATE POLICY "trials_insert_returning" ON trials
  FOR SELECT
  USING (is_org_admin(org_id) OR is_staff_with_support(org_id));
