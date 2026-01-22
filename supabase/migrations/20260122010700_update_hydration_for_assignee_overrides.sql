-- ============================================================================
-- UPDATE HYDRATION TO SUPPORT ASSIGNEE OVERRIDES
-- ============================================================================
-- Updates hydrate_remaining_visits() to accept and use assignee overrides
-- from the enrollment UI.
-- ============================================================================

-- Drop old function first
DROP FUNCTION IF EXISTS hydrate_remaining_visits(UUID, UUID, DATE);

-- Create new function with overrides parameter
CREATE OR REPLACE FUNCTION hydrate_remaining_visits(
  p_patient_id UUID,
  p_trial_id UUID,
  p_baseline_date DATE,
  p_assignee_overrides JSONB DEFAULT NULL
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
  v_override_user_id TEXT;
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

  -- Loop through visits EXCLUDING screening (order > 1)
  FOR v_visit IN
    SELECT visit
    FROM jsonb_array_elements(v_template->'visits') AS visit
    WHERE (visit->>'order')::integer > 1
    ORDER BY (visit->>'order')::integer
  LOOP
    -- Calculate scheduled date from baseline (Day 0)
    v_scheduled_date := p_baseline_date + (v_visit->>'days_from_day_zero')::integer;

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

      -- Check for assignee override first
      -- Override key format: "v{visit_order}-{activity_id}" (e.g., "v2-vitals")
      v_override_user_id := NULL;
      IF p_assignee_overrides IS NOT NULL THEN
        -- Try visit-specific override first (e.g., "v2-vitals")
        v_override_user_id := p_assignee_overrides->>('v' || (v_visit->>'order') || '-' || v_activity_id);

        -- Fallback to activity-only key for backwards compatibility
        IF v_override_user_id IS NULL THEN
          v_override_user_id := p_assignee_overrides->>v_activity_id;
        END IF;
      END IF;

      -- Use override if provided, otherwise use template assignee
      IF v_override_user_id IS NOT NULL THEN
        -- Use override (can be explicit NULL for "unassigned")
        IF v_override_user_id = '' OR v_override_user_id = 'null' THEN
          v_assignee_user_id := NULL;
        ELSE
          v_assignee_user_id := v_override_user_id::UUID;
        END IF;
      ELSE
        -- Use template assignee
        v_assignee_role := v_template->'assignees'->>v_activity_id;

        -- Get user with that role (NULL if role not found in team)
        IF v_assignee_role IS NOT NULL THEN
          v_assignee_user_id := get_user_by_trial_role(p_trial_id, v_assignee_role);
        ELSE
          v_assignee_user_id := NULL;
        END IF;
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
        NULL,
        v_assignee_user_id,
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

COMMENT ON FUNCTION hydrate_remaining_visits IS
  'Creates remaining visits (order > 1, from Day 0 onwards) and their tasks.
   Called during enrollment when baseline_date is set.
   Accepts optional p_assignee_overrides to override template assignees.
   Returns JSONB summary of created records.';
