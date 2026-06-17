-- Asynchronous Teams send jobs.
--
-- Large Teams distributions exceeded the serverless request timeout: the send
-- loop is sequential (rate-limited) so 40+ recipients could not complete within
-- a single HTTP request. This table backs a background worker (Netlify
-- Background Function) that processes a send out-of-band and records progress,
-- so the originating request returns immediately and the UI polls for status.

CREATE TABLE teams_send_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,                 -- non_responders | never_invited | manual | all
  message_type TEXT NOT NULL,         -- invitation | reminder
  token_ids JSONB,                    -- only set for mode = 'manual'
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'error')),
  total INT NOT NULL DEFAULT 0,
  sent INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  not_installed INT NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_send_jobs_survey_id ON teams_send_jobs (survey_id);
CREATE INDEX idx_teams_send_jobs_status ON teams_send_jobs (status);

ALTER TABLE teams_send_jobs ENABLE ROW LEVEL SECURITY;

-- Admin and HR can read job status (writes go through the service-role client).
CREATE POLICY "Admin and HR can read teams_send_jobs"
  ON teams_send_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr_management')
    )
  );
