-- Store benchmark reference data (replaces static JSON file)
CREATE TABLE IF NOT EXISTS benchmark_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  market_average NUMERIC(3,1) NOT NULL,
  by_industry JSONB NOT NULL DEFAULT '{}',
  by_company_size JSONB NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS benchmark_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES benchmark_themes(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  text_fr TEXT NOT NULL,
  text_en TEXT NOT NULL,
  market_average NUMERIC(3,1) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(theme_id, code)
);

-- RLS
ALTER TABLE benchmark_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read benchmark themes"
  ON benchmark_themes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read benchmark questions"
  ON benchmark_questions FOR SELECT TO authenticated USING (true);
