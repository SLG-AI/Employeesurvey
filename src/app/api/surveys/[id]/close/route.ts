import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchQuestionsToBenchmarks } from "@/lib/ai/benchmark-matching";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: surveyId } = await params;

  // Auth check
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

  // Verify survey exists and is published
  const { data: survey } = await admin
    .from("surveys")
    .select("id, status")
    .eq("id", surveyId)
    .single();

  if (!survey) {
    return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });
  }

  if (survey.status !== "published") {
    return NextResponse.json(
      { error: "Seul un sondage publié peut être clôturé" },
      { status: 400 }
    );
  }

  // Close the survey
  const { error: closeError } = await admin
    .from("surveys")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", surveyId);

  if (closeError) {
    return NextResponse.json(
      { error: `Erreur clôture : ${closeError.message}` },
      { status: 500 }
    );
  }

  // Run benchmark matching in background (don't block the response)
  runBenchmarkMatching(admin, surveyId).catch((err) => {
    console.error("Benchmark matching failed for survey", surveyId, err);
  });

  return NextResponse.json({ success: true });
}

async function runBenchmarkMatching(
  admin: ReturnType<typeof createAdminClient>,
  surveyId: string
) {
  // Load questions with sections
  const { data: questions } = await admin
    .from("questions")
    .select("id, text_fr, type, section_id")
    .eq("survey_id", surveyId)
    .order("sort_order");

  if (!questions || questions.length === 0) return;

  // Load sections
  const { data: sections } = await admin
    .from("survey_sections")
    .select("id, title_fr")
    .eq("survey_id", surveyId);

  const sectionMap = new Map(
    (sections || []).map((s) => [s.id, s.title_fr])
  );

  const questionsInput = questions.map((q) => ({
    id: q.id,
    text_fr: q.text_fr,
    type: q.type,
    section_id: q.section_id,
    section_title: q.section_id ? sectionMap.get(q.section_id) || null : null,
  }));

  const mappings = await matchQuestionsToBenchmarks(questionsInput);

  if (mappings.length === 0) return;

  // Delete existing benchmarks for this survey
  await admin.from("survey_benchmarks").delete().eq("survey_id", surveyId);

  // Insert new mappings
  await admin.from("survey_benchmarks").insert(
    mappings.map((m) => ({
      survey_id: surveyId,
      question_id: m.question_id,
      section_id: m.section_id,
      benchmark_theme_code: m.benchmark_theme_code,
      benchmark_question_code: m.benchmark_question_code,
      confidence: m.confidence,
    }))
  );
}
