-- Auto-accept invitations and create organization members on email confirmation
-- This trigger handles the post-signup flow for clinic users

-- Function to process invitation acceptance when user confirms email
CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  pending_invitation RECORD;
BEGIN
  -- Only process if email was just confirmed (NULL → NOT NULL)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN

    -- Find pending invitation for this email
    SELECT id, org_id, org_role
    INTO pending_invitation
    FROM invitations
    WHERE email = NEW.email
      AND status = 'pending'
      AND expires_at > NOW()
    LIMIT 1;

    -- If invitation exists, process it
    IF pending_invitation.id IS NOT NULL THEN

      -- Create organization membership
      INSERT INTO organization_members (user_id, org_id, org_role, status)
      VALUES (NEW.id, pending_invitation.org_id, pending_invitation.org_role, 'active')
      ON CONFLICT (user_id, org_id) DO NOTHING;

      -- Mark invitation as accepted
      UPDATE invitations
      SET status = 'accepted'
      WHERE id = pending_invitation.id;

      RAISE NOTICE 'Accepted invitation % for user %', pending_invitation.id, NEW.email;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on UPDATE of auth.users (when email is confirmed)
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_invitation_acceptance();
