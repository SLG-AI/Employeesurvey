import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import benchmarkFallback from "@/lib/benchmarks-template.json";

type QuestionInput = {
  id: string;
  text_fr: string;
  type: string;
  section_id: string | null;
  section_title: string | null;
};

type BenchmarkMapping = {
  question_id: string;
  section_id: string | null;
  benchmark_theme_code: string;
  benchmark_question_code: string | null;
  confidence: number;
};

type ThemeSummary = {
  code: string;
  label: string;
  questions: { code: string; text: string }[];
};

async function getThemeSummary(): Promise<ThemeSummary[]> {
  const admin = createAdminClient();
  const { data: dbThemes } = await admin
    .from("benchmark_themes")
    .select("code, label_fr, benchmark_questions(code, text_fr)")
    .order("sort_order");

  if (dbThemes && dbThemes.length > 0) {
    return dbThemes.map((t) => ({
      code: t.code,
      label: t.label_fr,
      questions: ((t.benchmark_questions as { code: string; text_fr: string }[]) || []).map(
        (q) => ({ code: q.code, text: q.text_fr })
      ),
    }));
  }

  // Fallback to static JSON
  return benchmarkFallback.themes.map((t) => ({
    code: t.code,
    label: t.label_fr,
    questions: t.questions.map((q) => ({ code: q.code, text: q.text_fr })),
  }));
}

export async function matchQuestionsToBenchmarks(
  questions: QuestionInput[]
): Promise<BenchmarkMapping[]> {
  // Only match likert questions (they have numeric scores)
  const likertQuestions = questions.filter(
    (q) => q.type === "likert" || q.type === "likert_5"
  );

  if (likertQuestions.length === 0) return [];

  const themeSummary = await getThemeSummary();
  const client = new Anthropic();

  const prompt = `Tu es un expert en sondages employés. Tu dois associer chaque question d'un sondage à un thème et éventuellement une question de référence du benchmark.

Voici les thèmes et questions de référence du benchmark :
${JSON.stringify(themeSummary, null, 2)}

Voici les questions du sondage à mapper :
${JSON.stringify(
  likertQuestions.map((q) => ({
    id: q.id,
    text: q.text_fr,
    section: q.section_title,
  })),
  null,
  2
)}

Pour chaque question, retourne un JSON array avec :
- question_id: l'id de la question
- benchmark_theme_code: le code du thème benchmark le plus pertinent
- benchmark_question_code: le code de la question benchmark la plus proche (ou null si aucune ne correspond bien)
- confidence: un score de confiance entre 0 et 1

Réponds UNIQUEMENT avec le JSON array, sans markdown ni texte autour.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON response
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const mappings: {
    question_id: string;
    benchmark_theme_code: string;
    benchmark_question_code: string | null;
    confidence: number;
  }[] = JSON.parse(cleaned);

  // Enrich with section_id
  return mappings.map((m) => {
    const question = likertQuestions.find((q) => q.id === m.question_id);
    return {
      question_id: m.question_id,
      section_id: question?.section_id || null,
      benchmark_theme_code: m.benchmark_theme_code,
      benchmark_question_code: m.benchmark_question_code,
      confidence: m.confidence,
    };
  });
}
