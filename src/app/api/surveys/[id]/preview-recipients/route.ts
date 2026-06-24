import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  markTeamsAvailability,
  selectRecipients,
  type SendMode,
} from "@/lib/surveys/recipient-selector";
import { normalizePhone } from "@/lib/sms/twilio";

const DEFAULT_MAX_PREVIEW = 200;
const ABSOLUTE_MAX = 5000;
const VALID_MODES: SendMode[] = [
  "non_responders",
  "never_invited",
  "manual",
  "all",
];

export async function POST(
  req: NextRequest,
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

  let body: {
    mode?: string;
    tokenIds?: unknown;
    channels?: unknown;
    limit?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const mode = body.mode as SendMode;
  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: "Mode invalide" }, { status: 400 });
  }

  const tokenIds = Array.isArray(body.tokenIds)
    ? (body.tokenIds as unknown[]).filter((v): v is string => typeof v === "string")
    : undefined;

  const limit =
    typeof body.limit === "number" && body.limit > 0
      ? Math.min(body.limit, ABSOLUTE_MAX)
      : DEFAULT_MAX_PREVIEW;

  const admin = createAdminClient();
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

  const { tokens } = selection;
  const teamsInstalled = await markTeamsAvailability(admin, tokens);
  const hasPhone = (t: (typeof tokens)[number]) => !!normalizePhone(t.phone);

  const emailCount = tokens.filter((t) => !!t.email).length;
  const teamsCount = tokens.filter((t) => teamsInstalled.has(t.id)).length;
  const smsCount = tokens.filter(hasPhone).length;
  const neitherCount = tokens.filter(
    (t) => !t.email && !teamsInstalled.has(t.id) && !hasPhone(t)
  ).length;

  const recipients = tokens.slice(0, limit).map((t) => ({
    token_id: t.id,
    employee_name: t.employee_name,
    email: t.email,
    has_teams: teamsInstalled.has(t.id),
    has_phone: hasPhone(t),
    invitation_sent_at: t.invitation_sent_at,
    reminder_sent_at: t.reminder_sent_at,
    teams_invitation_sent_at: t.teams_invitation_sent_at,
    teams_reminder_sent_at: t.teams_reminder_sent_at,
    phone_invitation_sent_at: t.phone_invitation_sent_at,
    phone_reminder_sent_at: t.phone_reminder_sent_at,
    responded: t.responded,
  }));

  return NextResponse.json({
    counts: {
      total: tokens.length,
      email: emailCount,
      teams: teamsCount,
      sms: smsCount,
      neither: neitherCount,
    },
    recipients,
    truncated: tokens.length > limit,
  });
}
