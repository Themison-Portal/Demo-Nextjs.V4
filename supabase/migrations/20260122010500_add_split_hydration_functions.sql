-- ============================================================================
-- SPLIT HYDRATION FUNCTIONS
-- ============================================================================
-- Replaces single hydrate_visit_schedule() with two separate functions:
--   1. hydrate_screening_visit() - Creates ONLY screening visit + tasks
--   2. hydrate_remaining_visits() - Creates remaining visits (Day 0+) + tasks
--
-- Flow:
--   Patient creation → hydrate_screening_visit()
--   Enrollment → hydrate_remaining_visits()
-- ============================================================================

-- ============================================================================
-- PART 1: Hydrate screening visit only
-- ============================================================================

CREATE OR REPLACE FUNCTION hydrate_screening_visit(
  p_patient_id UUID,
  p_trial_id UUID,
  p_screening_date DATE
)
RETURNS JSONB AS $$
DECLARE
  v_template JSONB;
  v_screening_visit JSONB;
  v_visit_record RECORD;
  v_activity_id TEXT;
  v_activity_name TEXT;
  v_assignee_role TEXT;
  v_assignee_user_id UUID;
  v_result JSONB;
  v_activities_created INTEGER := 0;
  v_tasks_created INTEGER := 0;
  v_activity_counter INTEGER := 0;
  v_day_zero_visit JSONB;
  v_window_days INTEGER;
  v_baseline_deadline DATE;
BEGIN
  -- Get template from trial
  SELECT visit_schedule_template INTO v_template
  FROM trials
  WHERE id = p_trial_id AND deleted_at IS NULL;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Trial % has no visit schedule template', p_trial_id;
  END IF;

  -- Find screening visit (first visit, not day_zero)
  SELECT visit INTO v_screening_visit
  FROM jsonb_array_elements(v_template->'visits') AS visit
  WHERE (visit->>'order')::integer = 1
    AND COALESCE((visit->>'is_day_zero')::boolean, false) = false
  LIMIT 1;

  IF v_screening_visit IS NULL THEN
    RAISE EXCEPTION 'Template must have a screening visit (order=1, is_day_zero=false)';
  END IF;

  -- Find day_zero visit to calculate baseline_deadline
  SELECT visit INTO v_day_zero_visit
  FROM jsonb_array_elements(v_template->'visits') AS visit
  WHERE (visit->>'is_day_zero')::boolean = true
  LIMIT 1;

  -- Calculate baseline_deadline_date
  -- Formula: screening_date + ABS(days_from_day_zero of day_zero visit - days_from_day_zero of screening)
  v_window_days := ABS(
    (v_day_zero_visit->>'days_from_day_zero')::integer -
    (v_screening_visit->>'days_from_day_zero')::integer
  );
  v_baseline_deadline := p_screening_date + v_window_days;

  -- Update patient with baseline_deadline_date
  UPDATE patients
  SET baseline_deadline_date = v_baseline_deadline
  WHERE id = p_patient_id;

  -- Create screening visit record
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
    v_screening_visit->>'name',
    v_screening_visit->>'name',
    (v_screening_visit->>'order')::integer,
    (v_screening_visit->>'days_from_day_zero')::integer,
    false,
    p_screening_date,
    'scheduled'
  )
  RETURNING * INTO v_visit_record;

  -- Loop through activities in screening visit
  FOR v_activity_id IN
    SELECT jsonb_array_elements_text(v_screening_visit->'activity_ids')
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
      v_activity_name || ' - ' || (v_screening_visit->>'name'),
      'todo',
      NULL,
      v_assignee_user_id,
      p_screening_date,
      'visit',
      v_visit_record.id
    );

    v_tasks_created := v_tasks_created + 1;
  END LOOP;

  -- Return summary
  v_result := jsonb_build_object(
    'visits_created', 1,
    'activities_created', v_activities_created,
    'tasks_created', v_tasks_created,
    'patient_id', p_patient_id,
    'trial_id', p_trial_id,
    'baseline_deadline_date', v_baseline_deadline
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION hydrate_screening_visit IS
  'Creates ONLY the screening visit (order=1) and its tasks.
   Called when patient is created with screening_date.
   Calculates and updates patient.baseline_deadline_date.
   Returns JSONB summary of created records.';

-- ============================================================================
-- PART 2: Hydrate remaining visits (Day 0 onwards)
-- ============================================================================

CREATE OR REPLACE FUNCTION hydrate_remaining_visits(
  p_patient_id UUID,
  p_trial_id UUID,
  p_baseline_date DATE
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
   Returns JSONB summary of created records.';
