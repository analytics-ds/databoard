-- Add logo_url to organizations (base64 data URL, same pattern as user avatars)
ALTER TABLE organizations ADD COLUMN logo_url TEXT;
