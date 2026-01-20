-- Fix get_user_by_trial_role to use org_member_id instead of user_id
-- trial_team_members now references organization_members.id, not users.id directly

CREATE OR REPLACE FUNCTION get_user_by_trial_role(
  p_trial_id UUID,
  p_role TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find first user with matching role in trial team
  -- JOIN through organization_members to get user_id
  SELECT om.user_id INTO v_user_id
  FROM trial_team_members ttm
  JOIN organization_members om ON om.id = ttm.org_member_id
  WHERE ttm.trial_id = p_trial_id
    AND ttm.trial_role = p_role
    AND om.deleted_at IS NULL
  LIMIT 1;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_by_trial_role IS
  'Helper to find user_id by trial role (e.g. "Laboratory", "Nurse").
   Returns NULL if no user with that role exists in trial team.
   Updated to use org_member_id schema.';
