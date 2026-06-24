import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSurveyLink } from "@/lib/utils/token";
import {
  isTwilioConfigured,
  normalizePhone,
  sendSurveySms,
  type SmsRecipient,
} from "@/lib/sms/twilio";
import {
  selectRecipients,
  type SendMode,
} from "@/lib/surveys/recipient-selector";

const VALID_MODES: SendMode[] = [
  "non_responders",
  "never_invited",
  "manual",
  "all",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: surveyId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "hr_management"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!isTwilioConfigured()) {
    return NextResponse.json(
      { error: "Canal SMS non configuré (Twilio)" },
      { status: 400 }
    );
  }

  let body: { mode?: string; tokenIds?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body → default behavior (non_responders)
  }

  const mode: SendMode = VALID_MODES.includes(body.mode as SendMode)
    ? (body.mode as SendMode)
    : "non_responders";

  const tokenIds = Array.isArray(body.tokenIds)
    ? (body.tokenIds as unknown[]).filter((v): v is string => typeof v === "string")
    : undefined;

  const admin = createAdminClient();

  const { data: survey, error: surveyError } = await admin
    .from("surveys")
    .select("title_fr, status")
    .eq("id", surveyId)
    .single();

  if (surveyError || !survey) {
    return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });
  }

  if (survey.status !== "published") {
    return NextResponse.json(
      { error: "Le sondage doit être publié pour envoyer des SMS" },
      { status: 400 }
    );
  }

  const selection = await selectRecipients(admin, { surveyId, mode, tokenIds });
  if (!selection.ok) {
    return NextResponse.json(
      { error: selection.error },
      { status: selection.status }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  // Keep only recipients with a usable phone number (normalised to E.164).
  const recipients: SmsRecipient[] = [];
  for (const t of selection.tokens) {
    const phone = normalizePhone(t.phone);
    if (!phone) continue;
    recipients.push({
      id: t.id,
      phone,
      surveyLink: generateSurveyLink(baseUrl, surveyId, t.token),
    });
  }

  if (recipients.length === 0) {
    return NextResponse.json({
      success: true,
      sent: 0,
      failed: 0,
      total: 0,
      message: "Aucun destinataire avec numéro de téléphone valide pour ce ciblage",
    });
  }

  // never_invited counts as a first invitation; everything else is a reminder.
  const column =
    mode === "never_invited" ? "phone_invitation_sent_at" : "phone_reminder_sent_at";
  const nowIso = new Date().toISOString();

  // Mark each recipient the instant its SMS is delivered (crash-safe / idempotent).
  const onSent = async (tokenId: string) => {
    if (selection.useSurveyTokens) {
      await admin
        .from("survey_tokens")
        .update({ [column]: nowIso })
        .eq("survey_id", surveyId)
        .eq("token_id", tokenId);
    } else {
      await admin
        .from("anonymous_tokens")
        .update({ [column]: nowIso })
        .eq("id", tokenId);
    }
  };

  const result = await sendSurveySms(recipients, survey.title_fr, onSent);

  return NextResponse.json({
    success: true,
    mode,
    sent: result.sent,
    failed: result.failed,
    total: recipients.length,
    errors: result.errors,
  });
}
