import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import benchmarkFallback from "@/lib/benchmarks-template.json";

type BenchmarkDetail = { avg: number; p25: number; p50: number; p75: number };

type ThemeScore = {
  theme_code: string;
  theme_label: string;
  survey_score: number;
  market_average: number;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  industry_average: number | null;
  industry_p25: number | null;
  industry_p75: number | null;
  size_average: number | null;
  size_p25: number | null;
  size_p75: number | null;
  combined_average: number | null;
  question_count: number;
};

type BenchmarkThemeRow = {
  code: string;
  label_fr: string;
  market_average: number;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  by_industry: Record<string, BenchmarkDetail | number>;
  by_company_size: Record<string, BenchmarkDetail | number>;
};

export async function GET(
  request: NextRequest,
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

  const admin = createAdminClient();

  // Load survey with societe info
  const { data: survey } = await admin
    .from("surveys")
    .select("id, title_fr, societe_id, status, distribution_mode")
    .eq("id", surveyId)
    .single();

  if (!survey) {
    return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });
  }

  // Load benchmark mappings
  const { data: mappings } = await admin
    .from("survey_benchmarks")
    .select("question_id, benchmark_theme_code, confidence")
    .eq("survey_id", surveyId);

  if (!mappings || mappings.length === 0) {
    return NextResponse.json({
      available: false,
      message: "Aucun benchmark disponible pour ce sondage. Le mapping sera généré à la clôture.",
    });
  }

  // Load benchmark reference data from DB, fallback to JSON
  const { data: dbThemes } = await admin
    .from("benchmark_themes")
    .select("code, label_fr, market_average, p25, p50, p75, by_industry, by_company_size")
    .order("sort_order");

  const benchmarkThemes: BenchmarkThemeRow[] =
    dbThemes && dbThemes.length > 0
      ? dbThemes
      : benchmarkFallback.themes.map((t) => ({
          code: t.code,
          label_fr: t.label_fr,
          market_average: t.market_average,
          p25: t.p25 ?? null,
          p50: t.p50 ?? null,
          p75: t.p75 ?? null,
          by_industry: t.by_industry as Record<string, BenchmarkDetail | number>,
          by_company_size: t.by_company_size as Record<string, BenchmarkDetail | number>,
        }));

  // Get societe industry_code and company_size
  let industryCode: string | null = null;
  let companySize: string | null = null;

  if (survey.societe_id) {
    const { data: societe } = await admin
      .from("organizations")
      .select("industry_code, company_size")
      .eq("id", survey.societe_id)
      .single();

    industryCode = societe?.industry_code || null;
    companySize = societe?.company_size || null;
  }

  // Load all answers for likert questions of this survey
  const questionIds = mappings.map((m) => m.question_id);

  const isOpenMode = survey.distribution_mode === "open";
  let responseIds: string[] = [];

  if (isOpenMode) {
    const { data: openResponses } = await admin
      .from("open_responses")
      .select("id")
      .eq("survey_id", surveyId);
    responseIds = (openResponses || []).map((r) => r.id);
  } else {
    const { data: responses } = await admin
      .from("responses")
      .select("id")
      .eq("survey_id", surveyId);
    responseIds = (responses || []).map((r) => r.id);
  }

  if (responseIds.length === 0) {
    return NextResponse.json({
      available: false,
      message: "Aucune réponse disponible.",
    });
  }

  // Load answers for mapped questions
  const answerColumn = isOpenMode ? "open_response_id" : "response_id";
  const { data: allAnswers } = await admin
    .from("answers")
    .select("question_id, numeric_value")
    .in(answerColumn, responseIds)
    .in("question_id", questionIds)
    .not("numeric_value", "is", null);

  // Calculate average score per theme
  const themeScores = new Map<string, { sum: number; count: number }>();

  for (const mapping of mappings) {
    const answers = (allAnswers || []).filter(
      (a) => a.question_id === mapping.question_id
    );
    if (answers.length === 0) continue;

    const avg =
      answers.reduce((s, a) => s + (a.numeric_value as number), 0) /
      answers.length;

    const existing = themeScores.get(mapping.benchmark_theme_code);
    if (existing) {
      existing.sum += avg;
      existing.count += 1;
    } else {
      themeScores.set(mapping.benchmark_theme_code, { sum: avg, count: 1 });
    }
  }

  // Build theme results
  const themes: ThemeScore[] = [];

  for (const [themeCode, scores] of themeScores) {
    const benchmarkTheme = benchmarkThemes.find((t) => t.code === themeCode);
    if (!benchmarkTheme) continue;

    const surveyScore = Math.round((scores.sum / scores.count) * 10) / 10;

    // Helper to extract avg from new {avg,p25,p50,p75} or old number format
    const extractDetail = (val: BenchmarkDetail | number | undefined) => {
      if (val === undefined || val === null) return null;
      if (typeof val === "number") return { avg: val, p25: null as number | null, p75: null as number | null };
      return { avg: val.avg, p25: val.p25, p75: val.p75 };
    };

    const industryDetail = industryCode ? extractDetail(benchmarkTheme.by_industry[industryCode]) : null;
    const sizeDetail = companySize ? extractDetail(benchmarkTheme.by_company_size[companySize]) : null;

    const industryAvg = industryDetail?.avg ?? null;
    const sizeAvg = sizeDetail?.avg ?? null;

    const combinedAvg =
      industryAvg !== null && sizeAvg !== null
        ? Math.round(((industryAvg + sizeAvg) / 2) * 10) / 10
        : industryAvg ?? sizeAvg ?? null;

    themes.push({
      theme_code: themeCode,
      theme_label: benchmarkTheme.label_fr,
      survey_score: surveyScore,
      market_average: benchmarkTheme.market_average,
      p25: benchmarkTheme.p25 ?? null,
      p50: benchmarkTheme.p50 ?? null,
      p75: benchmarkTheme.p75 ?? null,
      industry_average: industryAvg,
      industry_p25: industryDetail?.p25 ?? null,
      industry_p75: industryDetail?.p75 ?? null,
      size_average: sizeAvg,
      size_p25: sizeDetail?.p25 ?? null,
      size_p75: sizeDetail?.p75 ?? null,
      combined_average: combinedAvg,
      question_count: scores.count,
    });
  }

  // Global averages
  const globalSurvey =
    themes.length > 0
      ? Math.round(
          (themes.reduce((s, t) => s + t.survey_score, 0) / themes.length) * 10
        ) / 10
      : 0;
  const globalMarket =
    themes.length > 0
      ? Math.round(
          (themes.reduce((s, t) => s + t.market_average, 0) / themes.length) *
            10
        ) / 10
      : 0;

  return NextResponse.json({
    available: true,
    survey_title: survey.title_fr,
    industry_code: industryCode,
    company_size: companySize,
    global: {
      survey_score: globalSurvey,
      market_average: globalMarket,
    },
    themes,
  });
}
