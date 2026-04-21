import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSurveyEmails } from "@/lib/email/resend";
import { generateSurveyLink } from "@/lib/utils/token";
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

  let body: { mode?: string; tokenIds?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body = default behavior (non_responders)
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
    return NextResponse.json(
      { error: "Sondage introuvable" },
      { status: 404 }
    );
  }

  if (survey.status !== "published") {
    return NextResponse.json(
      { error: "Le sondage doit être publié pour envoyer des rappels" },
      { status: 400 }
    );
  }

  const selection = await selectRecipients(admin, {
    surveyId,
    mode,
    tokenIds,
  });

  if (!selection.ok) {
    return NextResponse.json(
      { error: selection.error },
      { status: selection.status }
    );
  }

  const emailTokens = selection.tokens.filter((t) => !!t.email);

  if (emailTokens.length === 0) {
    return NextResponse.json({
      success: true,
      sent: 0,
      failed: 0,
      total: 0,
      message: "Aucun destinataire avec email pour ce ciblage",
    });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const recipients = emailTokens.map((t) => ({
    email: t.email!,
    employeeName: t.employee_name || "Collaborateur",
    surveyLink: generateSurveyLink(baseUrl, surveyId, t.token),
  }));

  const emailType = mode === "never_invited" ? "invitation" : "reminder";
  const result = await sendSurveyEmails(recipients, survey.title_fr, emailType);

  if (result.sent > 0) {
    const failedEmails = new Set(result.errors.map((e) => e.email));
    const successTokens = emailTokens.filter(
      (t) => !failedEmails.has(t.email!)
    );

    const nowIso = new Date().toISOString();
    const columnToUpdate =
      mode === "never_invited" ? "invitation_sent_at" : "reminder_sent_at";

    if (selection.useSurveyTokens) {
      if (successTokens.length > 0) {
        await admin
          .from("survey_tokens")
          .update({ [columnToUpdate]: nowIso })
          .eq("survey_id", surveyId)
          .in(
            "token_id",
            successTokens.map((t) => t.id)
          );
      }
    } else {
      await admin
        .from("anonymous_tokens")
        .update({ [columnToUpdate]: nowIso })
        .in(
          "id",
          successTokens.map((t) => t.id)
        );
    }
  }

  return NextResponse.json({
    success: true,
    mode,
    sent: result.sent,
    failed: result.failed,
    total: recipients.length,
    errors: result.errors,
  });
}
