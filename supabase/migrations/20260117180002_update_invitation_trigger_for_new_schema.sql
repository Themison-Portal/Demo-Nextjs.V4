-- Update invitation acceptance trigger for new organization_members schema
-- Now that organization_members has its own id and partial unique index,
-- we need to adjust the insert logic

CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  pending_invitation RECORD;
  existing_member_id UUID;
BEGIN
  -- Only process if email was just confirmed (NULL → NOT NULL)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN

    -- Find pending invitation for this email
    SELECT id, org_id, org_role
    INTO pending_invitation
    FROM public.invitations
    WHERE email = NEW.email
      AND status = 'pending'
      AND expires_at > NOW()
    LIMIT 1;

    -- If invitation exists, process it
    IF FOUND THEN

      -- Check if active membership already exists
      SELECT id INTO existing_member_id
      FROM public.organization_members
      WHERE user_id = NEW.id
        AND org_id = pending_invitation.org_id
        AND deleted_at IS NULL;

      -- Only create if no active membership exists
      IF existing_member_id IS NULL THEN
        INSERT INTO public.organization_members (user_id, org_id, org_role, status)
        VALUES (NEW.id, pending_invitation.org_id, pending_invitation.org_role, 'active');

        RAISE NOTICE 'Created membership for user % in org %', NEW.email, pending_invitation.org_id;
      ELSE
        RAISE NOTICE 'User % already has active membership in org %', NEW.email, pending_invitation.org_id;
      END IF;

      -- Mark invitation as accepted
      UPDATE public.invitations
      SET status = 'accepted'
      WHERE id = pending_invitation.id;

      RAISE NOTICE 'Accepted invitation % for user %', pending_invitation.id, NEW.email;
    ELSE
      -- No invitation found - user signed up without invitation (e.g., staff)
      RAISE NOTICE 'No pending invitation for user %', NEW.email;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;
