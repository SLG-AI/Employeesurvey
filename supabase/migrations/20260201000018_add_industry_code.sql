-- Add industry_code to organizations table (for societe type)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry_code TEXT;
