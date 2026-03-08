-- Add percentiles and per-question industry/size benchmarks

-- Theme level: add percentile columns
ALTER TABLE benchmark_themes
  ADD COLUMN IF NOT EXISTS p25 NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS p50 NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS p75 NUMERIC(3,1);

-- Question level: add percentile columns + industry/size JSONB
ALTER TABLE benchmark_questions
  ADD COLUMN IF NOT EXISTS p25 NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS p50 NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS p75 NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS by_industry JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS by_company_size JSONB NOT NULL DEFAULT '{}';
