-- Add distribution mode to surveys
ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS distribution_mode TEXT NOT NULL DEFAULT 'token'
    CHECK (distribution_mode IN ('token', 'open')),
  ADD COLUMN IF NOT EXISTS open_self_declaration_fields TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS estimated_population INTEGER;

-- Open responses table for "Accès libre" mode
CREATE TABLE IF NOT EXISTS open_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_fingerprint TEXT NOT NULL,
  -- Self-declaration fields
  sexe TEXT,
  fonction TEXT,
  lieu_travail TEXT,
  type_contrat TEXT,
  temps_travail TEXT,
  cost_center TEXT,
  direction TEXT,
  departement TEXT,
  service TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, respondent_fingerprint)
);

ALTER TABLE open_responses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_open_responses_survey ON open_responses(survey_id);

-- RLS: anon can insert (for public survey submission)
CREATE POLICY "anon_insert_open_responses" ON open_responses
  FOR INSERT TO anon WITH CHECK (true);

-- RLS: authenticated admins can read
CREATE POLICY "admin_read_open_responses" ON open_responses
  FOR SELECT TO authenticated USING (true);

-- Allow answers to reference open_responses
ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS open_response_id UUID REFERENCES open_responses(id) ON DELETE CASCADE;

ALTER TABLE answers ALTER COLUMN response_id DROP NOT NULL;

-- Ensure exactly one response reference per answer
ALTER TABLE answers ADD CONSTRAINT chk_answer_response_type
  CHECK (
    (response_id IS NOT NULL AND open_response_id IS NULL)
    OR (response_id IS NULL AND open_response_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_answers_open_response ON answers(open_response_id)
  WHERE open_response_id IS NOT NULL;
