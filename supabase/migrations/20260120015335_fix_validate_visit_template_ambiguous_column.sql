-- Fix ambiguous column reference in validate_visit_template function
-- The variable 'visit' was colliding with the table alias 'AS visit'

CREATE OR REPLACE FUNCTION validate_visit_template(template JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  day_zero_count INTEGER;
  visit_orders INTEGER[];
  visit_names TEXT[];
BEGIN
  -- Template can be NULL
  IF template IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Must have visits array
  IF template->'visits' IS NULL THEN
    RAISE EXCEPTION 'Template must have a "visits" array';
  END IF;

  -- Count visits marked as day_zero
  SELECT COUNT(*) INTO day_zero_count
  FROM jsonb_array_elements(template->'visits') AS v
  WHERE (v->>'is_day_zero')::boolean = true;

  -- Must have exactly one day_zero
  IF day_zero_count != 1 THEN
    RAISE EXCEPTION 'Template must have exactly one visit marked as is_day_zero=true, found %', day_zero_count;
  END IF;

  -- Check for duplicate visit orders
  SELECT ARRAY_AGG((v->>'order')::integer) INTO visit_orders
  FROM jsonb_array_elements(template->'visits') AS v;

  IF (SELECT COUNT(DISTINCT unnest) FROM unnest(visit_orders)) != array_length(visit_orders, 1) THEN
    RAISE EXCEPTION 'Template has duplicate visit orders';
  END IF;

  -- Check for duplicate visit names
  SELECT ARRAY_AGG(v->>'name') INTO visit_names
  FROM jsonb_array_elements(template->'visits') AS v;

  IF (SELECT COUNT(DISTINCT unnest) FROM unnest(visit_names)) != array_length(visit_names, 1) THEN
    RAISE EXCEPTION 'Template has duplicate visit names';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
