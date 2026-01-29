-- ============================================================================
-- FIX PREVIEW ENROLLMENT FUNCTION - Use full_name instead of name
-- ============================================================================
-- The users table has full_name (generated column), not name.
-- This fixes the "column u.name does not exist" error in production.
-- ============================================================================

CREATE OR REPLACE FUNCTION preview_enrollment(
  p_patient_id UUID,
  p_trial_id UUID,
  p_baseline_date DATE
)
RETURNS JSONB AS $$
DECLARE
  v_template JSONB;
  v_visit JSONB;
  v_activity_id TEXT;
  v_activity_name TEXT;
  v_scheduled_date DATE;
  v_assignee_role TEXT;
  v_assignee_user_id UUID;
  v_assignee_user JSONB;
  v_visits_preview JSONB[] := '{}';
  v_activities_preview JSONB[] := '{}';
  v_visit_preview JSONB;
  v_activity_preview JSONB;
BEGIN
  -- Get template from trial
  SELECT visit_schedule_template INTO v_template
  FROM trials
  WHERE id = p_trial_id AND deleted_at IS NULL;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Trial % has no visit schedule template', p_trial_id;
  END IF;

  -- Loop through visits EXCLUDING screening (order > 1)
  FOR v_visit IN
    SELECT visit
    FROM jsonb_array_elements(v_template->'visits') AS visit
    WHERE (visit->>'order')::integer > 1
    ORDER BY (visit->>'order')::integer
  LOOP
    -- Calculate scheduled date from baseline (Day 0)
    v_scheduled_date := p_baseline_date + (v_visit->>'days_from_day_zero')::integer;

    -- Reset activities array for this visit
    v_activities_preview := '{}';

    -- Loop through activities in visit
    FOR v_activity_id IN
      SELECT jsonb_array_elements_text(v_visit->'activity_ids')
    LOOP
      -- Get activity name: try trial_activity_types first, then global
      SELECT name INTO v_activity_name
      FROM trial_activity_types
      WHERE trial_id = p_trial_id
        AND activity_id = v_activity_id
        AND deleted_at IS NULL;

      -- Fallback to global catalog
      IF v_activity_name IS NULL THEN
        SELECT name INTO v_activity_name
        FROM activity_types
        WHERE id = v_activity_id
          AND deleted_at IS NULL;
      END IF;

      -- Ultimate fallback: use activity_id as name
      IF v_activity_name IS NULL THEN
        v_activity_name := v_activity_id;
      END IF;

      -- Get assignee role from template
      v_assignee_role := v_template->'assignees'->>v_activity_id;

      -- Get user with that role (NULL if role not found in team)
      v_assignee_user_id := NULL;
      v_assignee_user := NULL;

      IF v_assignee_role IS NOT NULL THEN
        -- Get user_id and user info (FIXED: use full_name instead of name)
        SELECT
          u.id,
          jsonb_build_object(
            'id', u.id,
            'name', u.full_name,
            'email', u.email
          )
        INTO v_assignee_user_id, v_assignee_user
        FROM trial_team_members ttm
        JOIN organization_members om ON om.id = ttm.org_member_id
        JOIN users u ON u.id = om.user_id
        WHERE ttm.trial_id = p_trial_id
          AND ttm.trial_role = v_assignee_role
          AND om.deleted_at IS NULL
        LIMIT 1;
      END IF;

      -- Build activity preview
      v_activity_preview := jsonb_build_object(
        'activity_id', v_activity_id,
        'activity_name', v_activity_name,
        'assigned_to_role', v_assignee_role,
        'assigned_to_user_id', v_assignee_user_id,
        'assigned_to_user', v_assignee_user
      );

      -- Add to activities array
      v_activities_preview := v_activities_preview || v_activity_preview;
    END LOOP;

    -- Build visit preview with activities
    v_visit_preview := jsonb_build_object(
      'name', v_visit->>'name',
      'order', (v_visit->>'order')::integer,
      'scheduled_date', v_scheduled_date,
      'days_from_day_zero', (v_visit->>'days_from_day_zero')::integer,
      'is_day_zero', COALESCE((v_visit->>'is_day_zero')::boolean, false),
      'activities', v_activities_preview
    );

    -- Add to visits array
    v_visits_preview := v_visits_preview || v_visit_preview;
  END LOOP;

  -- Return preview
  RETURN jsonb_build_object(
    'visits', v_visits_preview,
    'total_visits', array_length(v_visits_preview, 1),
    'total_activities', (
      SELECT COUNT(*)
      FROM jsonb_array_elements(v_template->'visits') AS visit
      CROSS JOIN LATERAL jsonb_array_elements_text(visit->'activity_ids') AS activity
      WHERE (visit->>'order')::integer > 1
    ),
    'baseline_date', p_baseline_date
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION preview_enrollment IS
  'Generates a preview of visits and activities that would be created during enrollment.
   Does NOT insert any records - returns JSONB for display purposes only.
   Used to show user what will be created before confirming enrollment.';
