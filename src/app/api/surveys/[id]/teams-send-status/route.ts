import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: surveyId } = await params;
  const jobId = request.nextUrl.searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "jobId requis" }, { status: 400 });
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

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("teams_send_jobs")
    .select(
      "id, survey_id, status, total, sent, failed, not_installed, errors, error_message"
    )
    .eq("id", jobId)
    .single();

  if (error || !job || job.survey_id !== surveyId) {
    return NextResponse.json({ error: "Job introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    total: job.total,
    sent: job.sent,
    failed: job.failed,
    notInstalled: job.not_installed,
    errors: job.errors,
    errorMessage: job.error_message,
  });
}
