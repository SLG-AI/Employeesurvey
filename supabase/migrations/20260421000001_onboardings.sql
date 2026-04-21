-- Onboarding module: one row per new employee, tenant-scoped.
-- state is a JSONB blob mirroring the legacy localStorage structure
-- ({ lang, checked: [indices], health: { pickerIdx: btnIdx }, rows: { 'body-internal': [...], 'body-external': [...] } }).

CREATE TABLE IF NOT EXISTS onboardings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  start_date DATE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_onboardings_tenant ON onboardings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboardings_slug ON onboardings(slug);
CREATE INDEX IF NOT EXISTS idx_onboardings_tenant_archived ON onboardings(tenant_id, archived_at);

ALTER TABLE onboardings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_all_onboardings" ON onboardings
  FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE OR REPLACE FUNCTION set_updated_at_onboardings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_onboardings_updated_at ON onboardings;
CREATE TRIGGER trg_onboardings_updated_at
  BEFORE UPDATE ON onboardings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_onboardings();
