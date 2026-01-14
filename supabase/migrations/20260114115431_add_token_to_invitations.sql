-- Add token field to invitations table
-- This token is used for invitation links sent via email

-- Step 1: Add token column (allow NULL temporarily)
ALTER TABLE invitations
ADD COLUMN token TEXT;

-- Step 2: Generate unique tokens for existing invitations (if any)
-- Uses secure random bytes encoded as base64 (43 chars)
UPDATE invitations
SET token = encode(gen_random_bytes(32), 'base64')
WHERE token IS NULL;

-- Step 3: Make token NOT NULL and UNIQUE
ALTER TABLE invitations
ALTER COLUMN token SET NOT NULL,
ADD CONSTRAINT invitations_token_unique UNIQUE (token);

-- Step 4: Add index for fast lookups by token
CREATE INDEX idx_invitations_token ON invitations(token);

-- Step 5: Add function to auto-generate token on insert
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if token is not provided
  IF NEW.token IS NULL THEN
    NEW.token = encode(gen_random_bytes(32), 'base64');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add trigger to auto-generate token
CREATE TRIGGER set_invitation_token
  BEFORE INSERT ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION generate_invitation_token();
