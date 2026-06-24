/**
 * Twilio SMS sending for survey distribution.
 *
 * Uses the Twilio REST API directly via fetch (no SDK dependency), which keeps
 * the serverless bundle small. Each message is an individual POST — Twilio has
 * no batch endpoint for distinct bodies — so we send with bounded concurrency
 * and mark each recipient as soon as it is delivered (crash-safe, idempotent on
 * retry), mirroring the Teams sending path.
 */

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// Either an alphanumeric Sender ID ("RH") / Twilio number, or a Messaging Service SID.
const FROM = process.env.TWILIO_SMS_FROM;
const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;
// Default country calling code for local numbers without a "+" prefix (Luxembourg).
const DEFAULT_COUNTRY_CODE = process.env.SMS_DEFAULT_COUNTRY_CODE || "352";

const CONCURRENCY = 8;

export function isTwilioConfigured(): boolean {
  return Boolean(ACCOUNT_SID && AUTH_TOKEN && (FROM || MESSAGING_SERVICE_SID));
}

/**
 * Normalises a raw phone number to E.164 (e.g. "+352621123456").
 * Local numbers (no "+"/"00" prefix) are assumed to be in DEFAULT_COUNTRY_CODE.
 * Returns null when the input cannot be turned into a plausible number.
 */
export function normalizePhone(
  raw: string | null | undefined,
  defaultCountryCode: string = DEFAULT_COUNTRY_CODE
): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/[\s().\-/]/g, "");
  if (!s) return null;

  // International prefix "00" → "+"
  if (s.startsWith("00")) s = "+" + s.slice(2);

  if (s.startsWith("+")) {
    return /^\+\d{6,15}$/.test(s) ? s : null;
  }

  // Local number: drop leading zeros, prepend the default country code.
  s = s.replace(/^0+/, "");
  if (!/^\d{4,15}$/.test(s)) return null;
  const candidate = `+${defaultCountryCode}${s}`;
  return /^\+\d{6,15}$/.test(candidate) ? candidate : null;
}

export interface SmsRecipient {
  /** Token id — passed back to onSent for incremental marking. */
  id: string;
  /** Already-normalised E.164 number. */
  phone: string;
  surveyLink: string;
}

export interface SendSmsResult {
  sent: number;
  failed: number;
  errors: Array<{ id: string; phone: string; error: string }>;
}

function buildBody(surveyTitle: string, link: string): string {
  // Keep the title short so a short link can fit a single GSM-7 segment.
  const title =
    surveyTitle.length > 45 ? surveyTitle.slice(0, 44).trimEnd() + "…" : surveyTitle;
  return `Sondage "${title}" (anonyme) — merci d'y repondre : ${link}`;
}

async function sendOne(
  recipient: SmsRecipient,
  surveyTitle: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64");

  const form = new URLSearchParams();
  form.set("To", recipient.phone);
  if (MESSAGING_SERVICE_SID) {
    form.set("MessagingServiceSid", MESSAGING_SERVICE_SID);
  } else {
    form.set("From", FROM as string);
  }
  form.set("Body", buildBody(surveyTitle, recipient.surveyLink));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const data = (await res.json()) as { message?: string; code?: number };
        if (data?.message) message = data.message;
      } catch {
        // keep HTTP status
      }
      return { ok: false, error: message };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur réseau Twilio",
    };
  }
}

/**
 * Sends the survey SMS to every recipient.
 * `onSent` is awaited after each successful delivery so the caller can persist
 * "invited" state incrementally (crash-safe against serverless timeouts).
 */
export async function sendSurveySms(
  recipients: SmsRecipient[],
  surveyTitle: string,
  onSent?: (id: string) => Promise<void> | void
): Promise<SendSmsResult> {
  const result: SendSmsResult = { sent: 0, failed: 0, errors: [] };
  if (!isTwilioConfigured()) {
    result.failed = recipients.length;
    for (const r of recipients) {
      result.errors.push({ id: r.id, phone: r.phone, error: "Twilio non configuré" });
    }
    return result;
  }

  for (let i = 0; i < recipients.length; i += CONCURRENCY) {
    const batch = recipients.slice(i, i + CONCURRENCY);
    const outcomes = await Promise.all(
      batch.map(async (recipient) => ({
        recipient,
        outcome: await sendOne(recipient, surveyTitle),
      }))
    );

    for (const { recipient, outcome } of outcomes) {
      if (outcome.ok) {
        result.sent += 1;
        if (onSent) {
          try {
            await onSent(recipient.id);
          } catch {
            // Marking failure shouldn't fail the send; a retry stays idempotent.
          }
        }
      } else {
        result.failed += 1;
        result.errors.push({
          id: recipient.id,
          phone: recipient.phone,
          error: outcome.error,
        });
      }
    }
  }

  return result;
}
