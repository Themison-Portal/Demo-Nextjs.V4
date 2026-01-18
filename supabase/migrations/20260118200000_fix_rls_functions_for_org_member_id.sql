-- Migration: Fix RLS functions to use org_member_id instead of user_id
-- The functions has_trial_access and has_critical_permission were not updated
-- when trial_team_members.user_id was replaced with org_member_id

-- ============================================================================
-- FIX: has_trial_access function
-- ============================================================================

CREATE OR REPLACE FUNCTION has_trial_access(trial_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  trial_org_id UUID;
BEGIN
  -- Get trial's org_id
  SELECT org_id INTO trial_org_id
  FROM public.trials
  WHERE id = trial_id_param;

  -- Staff with support enabled
  IF is_staff_with_support(trial_org_id) THEN
    RETURN TRUE;
  END IF;

  -- Org admin (superadmin/admin have access to ALL trials)
  IF is_org_admin(trial_org_id) THEN
    RETURN TRUE;
  END IF;

  -- Trial team member via organization_members
  RETURN EXISTS (
    SELECT 1
    FROM public.trial_team_members ttm
    JOIN public.organization_members om ON om.id = ttm.org_member_id
    WHERE ttm.trial_id = trial_id_param
      AND om.user_id = auth.uid()
      AND om.deleted_at IS NULL
  );
END;
$$;

-- ============================================================================
-- FIX: has_critical_permission function
-- ============================================================================

CREATE OR REPLACE FUNCTION has_critical_permission(trial_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  trial_org_id UUID;
BEGIN
  -- Get trial's org_id
  SELECT org_id INTO trial_org_id
  FROM public.trials
  WHERE id = trial_id_param;

  -- Staff with support enabled
  IF is_staff_with_support(trial_org_id) THEN
    RETURN TRUE;
  END IF;

  -- Org admin (superadmin/admin have critical permissions)
  IF is_org_admin(trial_org_id) THEN
    RETURN TRUE;
  END IF;

  -- PI or CRC via organization_members
  RETURN EXISTS (
    SELECT 1
    FROM public.trial_team_members ttm
    JOIN public.organization_members om ON om.id = ttm.org_member_id
    WHERE ttm.trial_id = trial_id_param
      AND om.user_id = auth.uid()
      AND om.deleted_at IS NULL
      AND ttm.trial_role IN ('PI', 'CRC')
  );
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION has_trial_access IS 'Check if current user has access to a trial. Access via: staff+support, org admin, or trial_team member (via org_member_id).';
COMMENT ON FUNCTION has_critical_permission IS 'Check if current user has critical permissions for a trial. Access via: staff+support, org admin, or PI/CRC role (via org_member_id).';
