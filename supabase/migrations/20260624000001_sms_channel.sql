-- SMS distribution channel (Twilio)
-- Adds a phone number to the employee directory and per-channel send tracking,
-- mirroring the existing email / Teams columns.

alter table anonymous_tokens
  add column if not exists phone text,
  add column if not exists phone_invitation_sent_at timestamptz,
  add column if not exists phone_reminder_sent_at timestamptz;

alter table survey_tokens
  add column if not exists phone_invitation_sent_at timestamptz,
  add column if not exists phone_reminder_sent_at timestamptz;
