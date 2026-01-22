-- ============================================================================
-- UPDATE HYDRATION FUNCTION TO USE TRIAL_ACTIVITY_TYPES
-- ============================================================================
-- Updates hydrate_visit_schedule() to lookup activity metadata in this order:
--   1. trial_activity_types (trial-specific custom)
--   2. activity_types (global boilerplate)
--   3. Fallback to activity_id if not found
-- ============================================================================

CREATE OR REPLACE FUNCTION hydrate_visit_schedule(
  p_patient_id UUID,
  p_trial_id UUID,
  p_visit_start_date DATE
)
RETURNS JSONB AS $$
DECLARE
  v_template JSONB;
  v_visit JSONB;
  v_visit_record RECORD;
  v_activity_id TEXT;
  v_activity_name TEXT;
  v_scheduled_date DATE;
  v_assignee_role TEXT;
  v_assignee_user_id UUID;
  v_result JSONB;
  v_visits_created INTEGER := 0;
  v_activities_created INTEGER := 0;
  v_tasks_created INTEGER := 0;
  v_activity_counter INTEGER := 0;
BEGIN
  -- Get template from trial
  SELECT visit_schedule_template INTO v_template
  FROM trials
  WHERE id = p_trial_id AND deleted_at IS NULL;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Trial % has no visit schedule template', p_trial_id;
  END IF;

  -- Loop through visits in template
  FOR v_visit IN SELECT * FROM jsonb_array_elements(v_template->'visits')
  LOOP
    -- Calculate scheduled date (can be negative for pre-baseline visits)
    v_scheduled_date := p_visit_start_date + (v_visit->>'days_from_day_zero')::integer;

    -- Create visit record
    INSERT INTO visits (
      patient_id,
      visit_template_name,
      visit_name,
      visit_order,
      days_from_day_zero,
      is_day_zero,
      scheduled_date,
      status
    )
    VALUES (
      p_patient_id,
      v_visit->>'name',
      v_visit->>'name',
      (v_visit->>'order')::integer,
      (v_visit->>'days_from_day_zero')::integer,
      COALESCE((v_visit->>'is_day_zero')::boolean, false),
      v_scheduled_date,
      'scheduled'
    )
    RETURNING * INTO v_visit_record;

    v_visits_created := v_visits_created + 1;

    -- Reset activity counter for this visit
    v_activity_counter := 0;

    -- Loop through activities in visit
    FOR v_activity_id IN
      SELECT jsonb_array_elements_text(v_visit->'activity_ids')
    LOOP
      v_activity_counter := v_activity_counter + 1;

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

      -- Create visit_activity
      INSERT INTO visit_activities (
        visit_id,
        activity_type_id,
        activity_name,
        activity_order,
        status
      )
      VALUES (
        v_visit_record.id,
        v_activity_id,
        v_activity_name,
        v_activity_counter,
        'pending'
      );

      v_activities_created := v_activities_created + 1;

      -- Get assignee role from template
      v_assignee_role := v_template->'assignees'->>v_activity_id;

      -- Get user with that role (NULL if role not found in team)
      IF v_assignee_role IS NOT NULL THEN
        v_assignee_user_id := get_user_by_trial_role(p_trial_id, v_assignee_role);
      ELSE
        v_assignee_user_id := NULL;
      END IF;

      -- Create task with NULL priority (Trello-style)
      INSERT INTO tasks (
        trial_id,
        patient_id,
        visit_id,
        activity_type_id,
        title,
        status,
        priority,
        assigned_to,
        due_date,
        source,
        source_id
      )
      VALUES (
        p_trial_id,
        p_patient_id,
        v_visit_record.id,
        v_activity_id,
        v_activity_name || ' - ' || (v_visit->>'name'),
        'todo',
        NULL, -- Priority is now nullable (Trello-style)
        v_assignee_user_id, -- Can be NULL if role not in team
        v_scheduled_date,
        'visit',
        v_visit_record.id
      );

      v_tasks_created := v_tasks_created + 1;
    END LOOP;
  END LOOP;

  -- Return summary
  v_result := jsonb_build_object(
    'visits_created', v_visits_created,
    'activities_created', v_activities_created,
    'tasks_created', v_tasks_created,
    'patient_id', p_patient_id,
    'trial_id', p_trial_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION hydrate_visit_schedule IS
  'Main factory function to generate visit schedule for a patient.
   Called from backend when patient is created with visit_start_date.
   Looks up activity metadata in: trial_activity_types → activity_types → fallback to activity_id.
   Returns JSONB summary of created records.';
