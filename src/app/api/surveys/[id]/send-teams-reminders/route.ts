import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTeamsMessages, isTeamsConfigured } from "@/lib/teams/graph";
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

  if (!isTeamsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Microsoft Teams n'est pas configuré. Contactez votre administrateur pour définir les variables AZURE_TENANT_ID, AZURE_CLIENT_ID et AZURE_CLIENT_SECRET.",
      },
      { status: 400 }
    );
  }

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
    // Empty body → default (non_responders)
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

  const messageType = mode === "never_invited" ? "invitation" : "reminder";

  // Map each recipient email to its token id so we can mark delivery as it
  // happens. Marking incrementally (rather than once after the whole loop)
  // makes the send crash-safe: if the function times out mid-send, everyone
  // already reached is recorded, so a retry skips them and never double-sends.
  const columnToUpdate =
    mode === "never_invited"
      ? "teams_invitation_sent_at"
      : "teams_reminder_sent_at";
  const tokenIdByEmail = new Map<string, string>();
  for (const t of emailTokens) {
    tokenIdByEmail.set(t.email!.toLowerCase(), t.id);
  }

  const markSent = async (email: string) => {
    const tokenId = tokenIdByEmail.get(email.toLowerCase());
    if (!tokenId) return;
    try {
      if (selection.useSurveyTokens) {
        await admin
          .from("survey_tokens")
          .update({ [columnToUpdate]: new Date().toISOString() })
          .eq("survey_id", surveyId)
          .eq("token_id", tokenId);
      } else {
        await admin
          .from("anonymous_tokens")
          .update({ [columnToUpdate]: new Date().toISOString() })
          .eq("id", tokenId);
      }
    } catch (err) {
      console.error("[Teams] Failed to mark sent for", email, err);
    }
  };

  try {
    const result = await sendTeamsMessages(
      recipients,
      survey.title_fr,
      messageType,
      markSent
    );

    return NextResponse.json({
      success: true,
      mode,
      sent: result.sent,
      failed: result.failed,
      notInstalled: result.notInstalled || 0,
      total: recipients.length,
      errors: result.errors,
      ...(result.sent === 0 &&
      result.failed === 0 &&
      (result.notInstalled || 0) > 0
        ? {
            message: `Le bot Teams n'est pas installé pour ${result.notInstalled} destinataire(s). Les employés doivent d'abord installer l'application PulseSurvey dans Teams.`,
          }
        : {}),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur lors de l'envoi Teams",
      },
      { status: 500 }
    );
  }
}
