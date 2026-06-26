-- Per-onboarding editable checklist questions.
-- `content` mirrors the OnboardingContent model (src/lib/onboarding/content.ts):
-- { "<cardId>": [ { id, fr, en, owner } ] }.
-- Default '{}' means "use DEFAULT_CONTENT" at the application level (no backfill);
-- new rows are seeded with concrete content by the create API.

ALTER TABLE onboardings
  ADD COLUMN IF NOT EXISTS content JSONB NOT NULL DEFAULT '{}'::jsonb;
