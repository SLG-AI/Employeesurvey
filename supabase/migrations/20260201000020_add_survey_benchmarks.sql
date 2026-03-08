-- Store AI-generated benchmark mappings for survey questions/sections
CREATE TABLE IF NOT EXISTS survey_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  section_id UUID REFERENCES survey_sections(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  benchmark_theme_code TEXT NOT NULL,
  benchmark_question_code TEXT,
  confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, question_id)
);

-- Enable RLS
ALTER TABLE survey_benchmarks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read benchmarks
CREATE POLICY "Users can read survey benchmarks"
  ON survey_benchmarks FOR SELECT
  TO authenticated
  USING (true);
