-- Stores Teams bot installation references per user per tenant.
-- When the bot is installed for a user, we store the conversation reference
-- so we can send proactive messages later.

CREATE TABLE IF NOT EXISTS teams_bot_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  azure_tenant_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_aad_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  service_url TEXT NOT NULL,
  bot_id TEXT NOT NULL,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(azure_tenant_id, user_aad_id)
);

CREATE INDEX idx_teams_bot_installations_email ON teams_bot_installations(user_email);
CREATE INDEX idx_teams_bot_installations_tenant ON teams_bot_installations(azure_tenant_id);

-- RLS
ALTER TABLE teams_bot_installations ENABLE ROW LEVEL SECURITY;

-- Admin can read installations for their tenant
CREATE POLICY "admin_read_teams_installations" ON teams_bot_installations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr_management')
    )
  );
