-- Fix invitation tokens to be URL-safe
-- Change from base64 (has + and /) to hex (only 0-9 a-f)

-- Step 1: Update function to generate URL-safe tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if token is not provided
  IF NEW.token IS NULL THEN
    -- Use hex encoding instead of base64 (URL-safe: only 0-9 a-f)
    NEW.token = encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Regenerate existing tokens to be URL-safe
UPDATE invitations
SET token = encode(gen_random_bytes(32), 'hex')
WHERE token IS NOT NULL;
