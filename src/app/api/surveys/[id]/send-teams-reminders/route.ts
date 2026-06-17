import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTeamsConfigured } from "@/lib/teams/graph";
import {
  createTeamsJob,
  triggerTeamsWorker,
  processTeamsJob,
} from "@/lib/teams/send-job";
import { type SendMode } from "@/lib/surveys/recipient-selector";

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
    .select("status")
    .eq("id", surveyId)
    .single();

  if (surveyError || !survey) {
    return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });
  }

  if (survey.status !== "published") {
    return NextResponse.json(
      { error: "Le sondage doit être publié pour envoyer des rappels" },
      { status: 400 }
    );
  }

  // Enqueue the send as a background job so the request returns immediately and
  // large distributions are never capped by the serverless request timeout.
  const jobId = await createTeamsJob(admin, {
    surveyId,
    mode,
    tokenIds,
    createdBy: user.id,
  });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL || process.env.URL || request.nextUrl.origin;
  const triggered = await triggerTeamsWorker(jobId, origin);

  // Local dev (or any environment without the background function) has no worker
  // to call — process inline so the flow still completes end-to-end.
  if (!triggered) {
    await processTeamsJob(jobId);
  }

  return NextResponse.json({ async: true, jobId, mode, status: "queued" });
}
