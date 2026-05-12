-- =============================================
-- Likert questions: configurable scale "consigne" (anchors)
-- =============================================
-- A Likert question (1-5 or 1-10) can now use a named anchor set
-- ("agreement", "satisfaction", "frequency", "importance") whose
-- min/max labels are translated via the app i18n strings, or a
-- "custom" set where the admin types the min/max labels (FR/EN).

ALTER TABLE questions
  ADD COLUMN scale_variant TEXT NOT NULL DEFAULT 'agreement'
    CHECK (scale_variant IN ('agreement', 'satisfaction', 'frequency', 'importance', 'custom')),
  ADD COLUMN scale_min_label_fr TEXT,
  ADD COLUMN scale_min_label_en TEXT,
  ADD COLUMN scale_max_label_fr TEXT,
  ADD COLUMN scale_max_label_en TEXT;
