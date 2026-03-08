"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { matchQuestionsToBenchmarks } from "@/lib/ai/benchmark-matching";

// --- Guard ---

async function verifyPlatformAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Non authentifie");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) {
    throw new Error("Acces refuse");
  }

  return user.id;
}

// --- Types ---

export type ResponseProfile = "positive" | "negative" | "neutral" | "random" | "mixed";

export type PublishedSurveyInfo = {
  id: string;
  title_fr: string;
  status: string;
  distribution_mode: string;
  tenant_name: string;
  tenant_id: string;
  question_count: number;
  total_tokens: number;
  existing_responses: number;
  available_tokens: number;
};

export type GenerationResult = {
  success: boolean;
  created: number;
  skipped: number;
  errors: string[];
  summary: {
    likert_avg?: number;
    choice_questions: number;
    free_text_questions: number;
  };
};

// --- Fake text responses ---

const FAKE_COMMENTS_POSITIVE = [
  "Excellente ambiance de travail, je me sens valorisé.",
  "La communication entre les équipes s'est nettement améliorée.",
  "Mon manager est à l'écoute et me soutient dans mes projets.",
  "Les formations proposées sont pertinentes et enrichissantes.",
  "Je suis fier de travailler dans cette entreprise.",
  "L'équilibre vie pro/perso est bien respecté.",
  "Les outils mis à disposition sont performants.",
  "Je me sens impliqué dans les décisions de l'équipe.",
  "La direction communique de manière transparente.",
  "Les perspectives d'évolution sont claires et motivantes.",
];

const FAKE_COMMENTS_NEGATIVE = [
  "Le manque de reconnaissance est démotivant.",
  "La charge de travail est trop importante.",
  "Les processus internes sont trop lourds et ralentissent le travail.",
  "Je ne me sens pas écouté par ma hiérarchie.",
  "Les conditions de travail pourraient être améliorées.",
  "Le manque de communication crée des malentendus.",
  "Les objectifs ne sont pas toujours clairs.",
  "Il y a un décalage entre les discours et les actes.",
  "Les réunions sont trop nombreuses et peu productives.",
  "Le stress au travail est trop élevé.",
];

const FAKE_COMMENTS_NEUTRAL = [
  "Certains aspects sont positifs, d'autres à améliorer.",
  "La situation est correcte dans l'ensemble.",
  "Pas de commentaire particulier.",
  "Des améliorations sont possibles sur certains points.",
  "L'environnement de travail est acceptable.",
  "Rien de spécial à signaler.",
  "Globalement satisfaisant.",
  "Il y a du bon et du moins bon.",
  "C'est dans la moyenne.",
  "Je n'ai pas d'avis tranché sur le sujet.",
];

// --- Helpers ---

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateLikertValue(max: number, profile: ResponseProfile): number {
  switch (profile) {
    case "positive":
      // Weighted toward high values (60% top third, 30% middle, 10% bottom)
      return weightedRandom(max, [0.1, 0.3, 0.6]);
    case "negative":
      // Weighted toward low values
      return weightedRandom(max, [0.6, 0.3, 0.1]);
    case "neutral":
      // Weighted toward middle
      return weightedRandom(max, [0.15, 0.7, 0.15]);
    case "random":
      return randomInt(1, max);
    case "mixed":
      // Pick a random sub-profile for each answer
      return generateLikertValue(max, pickRandom(["positive", "negative", "neutral"]));
  }
}

function weightedRandom(max: number, weights: [number, number, number]): number {
  const third = max / 3;
  const roll = Math.random();
  if (roll < weights[0]) {
    return randomInt(1, Math.floor(third));
  } else if (roll < weights[0] + weights[1]) {
    return randomInt(Math.floor(third) + 1, Math.floor(third * 2));
  } else {
    return randomInt(Math.floor(third * 2) + 1, max);
  }
}

function getFakeComment(profile: ResponseProfile): string {
  switch (profile) {
    case "positive":
      return pickRandom(FAKE_COMMENTS_POSITIVE);
    case "negative":
      return pickRandom(FAKE_COMMENTS_NEGATIVE);
    case "neutral":
      return pickRandom(FAKE_COMMENTS_NEUTRAL);
    case "random":
    case "mixed":
      return pickRandom([
        ...FAKE_COMMENTS_POSITIVE,
        ...FAKE_COMMENTS_NEGATIVE,
        ...FAKE_COMMENTS_NEUTRAL,
      ]);
  }
}

// --- Main actions ---

export async function getPublishedSurveys(): Promise<PublishedSurveyInfo[]> {
  await verifyPlatformAdmin();
  const admin = createAdminClient();

  // Get published surveys with tenant info
  const { data: surveys } = await admin
    .from("surveys")
    .select("id, title_fr, status, distribution_mode, tenant_id")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!surveys || surveys.length === 0) return [];

  // Get tenant names
  const tenantIds = [...new Set(surveys.map((s) => s.tenant_id))];
  const { data: tenants } = await admin
    .from("tenants")
    .select("id, name")
    .in("id", tenantIds);

  const tenantMap: Record<string, string> = {};
  (tenants || []).forEach((t) => (tenantMap[t.id] = t.name));

  // Get question counts, token counts, and response counts in parallel
  const results: PublishedSurveyInfo[] = [];

  for (const survey of surveys) {
    const [
      { count: questionCount },
      { count: tokenCount },
      { count: responseCount },
      { count: openResponseCount },
    ] = await Promise.all([
      admin
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("survey_id", survey.id),
      admin
        .from("survey_tokens")
        .select("id", { count: "exact", head: true })
        .eq("survey_id", survey.id),
      admin
        .from("responses")
        .select("id", { count: "exact", head: true })
        .eq("survey_id", survey.id),
      admin
        .from("open_responses")
        .select("id", { count: "exact", head: true })
        .eq("survey_id", survey.id),
    ]);

    // Count tokens that haven't responded yet
    let availableTokens = 0;
    if (survey.distribution_mode === "token" && (tokenCount || 0) > 0) {
      const { data: respondedTokenIds } = await admin
        .from("responses")
        .select("token_id")
        .eq("survey_id", survey.id);

      const respondedSet = new Set((respondedTokenIds || []).map((r) => r.token_id));

      const { data: surveyTokens } = await admin
        .from("survey_tokens")
        .select("token_id")
        .eq("survey_id", survey.id);

      availableTokens = (surveyTokens || []).filter(
        (st) => !respondedSet.has(st.token_id)
      ).length;
    }

    const totalExisting =
      survey.distribution_mode === "token"
        ? responseCount || 0
        : openResponseCount || 0;

    results.push({
      id: survey.id,
      title_fr: survey.title_fr,
      status: survey.status,
      distribution_mode: survey.distribution_mode,
      tenant_name: tenantMap[survey.tenant_id] || "Inconnu",
      tenant_id: survey.tenant_id,
      question_count: questionCount || 0,
      total_tokens: tokenCount || 0,
      existing_responses: totalExisting,
      available_tokens: availableTokens,
    });
  }

  return results;
}

export async function generateTestResponses(
  surveyId: string,
  count: number,
  profile: ResponseProfile
): Promise<GenerationResult> {
  await verifyPlatformAdmin();
  const admin = createAdminClient();

  const result: GenerationResult = {
    success: false,
    created: 0,
    skipped: 0,
    errors: [],
    summary: { choice_questions: 0, free_text_questions: 0 },
  };

  // Load survey
  const { data: survey } = await admin
    .from("surveys")
    .select("id, status, distribution_mode, tenant_id")
    .eq("id", surveyId)
    .single();

  if (!survey) {
    result.errors.push("Sondage introuvable");
    return result;
  }

  if (survey.status !== "published") {
    result.errors.push("Le sondage doit etre en statut 'publie'");
    return result;
  }

  // Load questions with options
  const { data: questions } = await admin
    .from("questions")
    .select("id, type, question_options(id, value, sort_order)")
    .eq("survey_id", surveyId)
    .order("sort_order");

  if (!questions || questions.length === 0) {
    result.errors.push("Aucune question trouvee");
    return result;
  }

  // Track summary stats
  let likertSum = 0;
  let likertCount = 0;

  if (survey.distribution_mode === "token") {
    // --- Token mode ---
    // Find available tokens (not yet responded)
    const { data: respondedTokenIds } = await admin
      .from("responses")
      .select("token_id")
      .eq("survey_id", surveyId);

    const respondedSet = new Set((respondedTokenIds || []).map((r) => r.token_id));

    const { data: surveyTokens } = await admin
      .from("survey_tokens")
      .select("token_id")
      .eq("survey_id", surveyId);

    const availableTokenIds = (surveyTokens || [])
      .filter((st) => !respondedSet.has(st.token_id))
      .map((st) => st.token_id);

    if (availableTokenIds.length === 0) {
      result.errors.push("Aucun token disponible (tous ont deja repondu)");
      return result;
    }

    const tokensToUse = availableTokenIds.slice(0, Math.min(count, availableTokenIds.length));
    result.skipped = Math.max(0, count - availableTokenIds.length);

    // Load token details for org hierarchy
    const { data: tokenDetails } = await admin
      .from("anonymous_tokens")
      .select("id, societe_id, direction_id, department_id, service_id")
      .in("id", tokensToUse);

    const tokenMap: Record<string, typeof tokenDetails extends (infer T)[] | null ? T : never> = {};
    (tokenDetails || []).forEach((t) => (tokenMap[t.id] = t));

    // Generate responses one by one
    for (const tokenId of tokensToUse) {
      const token = tokenMap[tokenId];
      if (!token) continue;

      // Determine per-respondent profile for "mixed" mode
      const respondentProfile: ResponseProfile =
        profile === "mixed"
          ? pickRandom(["positive", "negative", "neutral"] as ResponseProfile[])
          : profile;

      const { data: response, error: responseError } = await admin
        .from("responses")
        .insert({
          survey_id: surveyId,
          token_id: tokenId,
          societe_id: token.societe_id,
          direction_id: token.direction_id,
          department_id: token.department_id,
          service_id: token.service_id,
        })
        .select("id")
        .single();

      if (responseError || !response) {
        result.errors.push(`Erreur creation reponse pour token ${tokenId}: ${responseError?.message}`);
        continue;
      }

      const answers = generateAnswers(questions, respondentProfile, response.id, null);

      // Track stats
      for (const a of answers) {
        if (a.numeric_value != null) {
          likertSum += a.numeric_value;
          likertCount++;
        }
      }

      const { error: answersError } = await admin.from("answers").insert(answers);

      if (answersError) {
        await admin.from("responses").delete().eq("id", response.id);
        result.errors.push(`Erreur insertion reponses: ${answersError.message}`);
        continue;
      }

      result.created++;
    }
  } else {
    // --- Open mode ---
    for (let i = 0; i < count; i++) {
      const fingerprint = `test-data-${Date.now()}-${crypto.randomUUID()}`;

      const respondentProfile: ResponseProfile =
        profile === "mixed"
          ? pickRandom(["positive", "negative", "neutral"] as ResponseProfile[])
          : profile;

      const { data: openResponse, error: openError } = await admin
        .from("open_responses")
        .insert({
          survey_id: surveyId,
          respondent_fingerprint: fingerprint,
          sexe: pickRandom(["Homme", "Femme"]),
          fonction: pickRandom(["Ingenieur", "Manager", "Technicien", "Commercial", "RH", "Finance", "Marketing"]),
          lieu_travail: pickRandom(["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Nantes"]),
          type_contrat: pickRandom(["CDI", "CDD", "Interim"]),
          temps_travail: pickRandom(["Temps plein", "Temps partiel"]),
        })
        .select("id")
        .single();

      if (openError || !openResponse) {
        result.errors.push(`Erreur creation reponse ouverte #${i + 1}: ${openError?.message}`);
        continue;
      }

      const answers = generateAnswers(questions, respondentProfile, null, openResponse.id);

      for (const a of answers) {
        if (a.numeric_value != null) {
          likertSum += a.numeric_value;
          likertCount++;
        }
      }

      const { error: answersError } = await admin.from("answers").insert(answers);

      if (answersError) {
        await admin.from("open_responses").delete().eq("id", openResponse.id);
        result.errors.push(`Erreur insertion reponses: ${answersError.message}`);
        continue;
      }

      result.created++;
    }
  }

  result.success = result.created > 0;
  result.summary.likert_avg = likertCount > 0 ? Math.round((likertSum / likertCount) * 100) / 100 : undefined;

  // Count question types
  for (const q of questions) {
    if (q.type === "free_text") result.summary.free_text_questions++;
    if (q.type === "single_choice" || q.type === "multiple_choice") result.summary.choice_questions++;
  }

  return result;
}

function generateAnswers(
  questions: {
    id: string;
    type: string;
    question_options: { id: string; value: string | null; sort_order: number }[];
  }[],
  profile: ResponseProfile,
  responseId: string | null,
  openResponseId: string | null
) {
  return questions.map((q) => {
    const base = {
      response_id: responseId,
      open_response_id: openResponseId,
      question_id: q.id,
      numeric_value: null as number | null,
      text_value: null as string | null,
      selected_option_ids: null as string[] | null,
    };

    switch (q.type) {
      case "likert":
        base.numeric_value = generateLikertValue(10, profile);
        break;
      case "likert_5":
        base.numeric_value = generateLikertValue(5, profile);
        break;
      case "single_choice":
        if (q.question_options.length > 0) {
          base.selected_option_ids = [pickRandom(q.question_options).id];
        }
        break;
      case "multiple_choice":
        if (q.question_options.length > 0) {
          const numSelected = randomInt(1, Math.min(3, q.question_options.length));
          const shuffled = [...q.question_options].sort(() => Math.random() - 0.5);
          base.selected_option_ids = shuffled.slice(0, numSelected).map((o) => o.id);
        }
        break;
      case "free_text":
        // 70% chance of leaving a comment
        if (Math.random() < 0.7) {
          base.text_value = getFakeComment(profile);
        }
        break;
    }

    return base;
  });
}

export async function purgeResponses(surveyId: string): Promise<{ deleted: number; error?: string }> {
  await verifyPlatformAdmin();
  const admin = createAdminClient();

  // Load survey to determine mode
  const { data: survey } = await admin
    .from("surveys")
    .select("distribution_mode")
    .eq("id", surveyId)
    .single();

  if (!survey) return { deleted: 0, error: "Sondage introuvable" };

  let deleted = 0;

  if (survey.distribution_mode === "token") {
    // Get response IDs
    const { data: responses } = await admin
      .from("responses")
      .select("id")
      .eq("survey_id", surveyId);

    if (responses && responses.length > 0) {
      const ids = responses.map((r) => r.id);
      await admin.from("answers").delete().in("response_id", ids);
      await admin.from("responses").delete().eq("survey_id", surveyId);
      deleted = responses.length;
    }
  } else {
    // Open mode
    const { data: responses } = await admin
      .from("open_responses")
      .select("id")
      .eq("survey_id", surveyId);

    if (responses && responses.length > 0) {
      const ids = responses.map((r) => r.id);
      await admin.from("answers").delete().in("open_response_id", ids);
      await admin.from("open_responses").delete().eq("survey_id", surveyId);
      deleted = responses.length;
    }
  }

  return { deleted };
}

export async function closeSurvey(
  surveyId: string
): Promise<{ success: boolean; error?: string }> {
  await verifyPlatformAdmin();
  const admin = createAdminClient();

  const { data: survey } = await admin
    .from("surveys")
    .select("id, status")
    .eq("id", surveyId)
    .single();

  if (!survey) return { success: false, error: "Sondage introuvable" };
  if (survey.status !== "published") {
    return { success: false, error: "Seul un sondage publie peut etre cloture" };
  }

  const { error: closeError } = await admin
    .from("surveys")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", surveyId);

  if (closeError) {
    return { success: false, error: closeError.message };
  }

  // Run benchmark matching in background
  runBenchmarkMatching(admin, surveyId).catch((err) => {
    console.error("Benchmark matching failed for survey", surveyId, err);
  });

  return { success: true };
}

async function runBenchmarkMatching(
  admin: ReturnType<typeof createAdminClient>,
  surveyId: string
) {
  const { data: questions } = await admin
    .from("questions")
    .select("id, text_fr, type, section_id")
    .eq("survey_id", surveyId)
    .order("sort_order");

  if (!questions || questions.length === 0) return;

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

  await admin.from("survey_benchmarks").delete().eq("survey_id", surveyId);
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
