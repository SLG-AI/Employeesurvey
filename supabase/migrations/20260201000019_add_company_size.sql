-- Add company_size to organizations table (for societe type)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_size TEXT;
