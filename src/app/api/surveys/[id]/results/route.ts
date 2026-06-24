import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ANONYMITY_THRESHOLD } from "@/lib/utils/anonymity";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Get filter params
  const { searchParams } = new URL(request.url);
  const societeId = searchParams.get("societe_id");
  const directionId = searchParams.get("direction_id");
  const departmentId = searchParams.get("department_id");
  const serviceId = searchParams.get("service_id");
  const sexe = searchParams.get("sexe");
  const fonction = searchParams.get("fonction");
  const lieuTravail = searchParams.get("lieu_travail");
  const typeContrat = searchParams.get("type_contrat");
  const tempsTravail = searchParams.get("temps_travail");
  const costCenter = searchParams.get("cost_center");
  const ageMin = searchParams.get("age_min");
  const ageMax = searchParams.get("age_max");
  const seniorityMin = searchParams.get("seniority_min");
  const seniorityMax = searchParams.get("seniority_max");

  // For managers, restrict to their assigned org units
  let allowedOrgIds: string[] | null = null;
  if (profile.role === "manager") {
    const { data: assignments } = await admin
      .from("manager_assignments")
      .select("organization_id")
      .eq("manager_id", user.id);

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        survey: null,
        totalResponses: 0,
        questions: [],
        message: "Aucune unité organisationnelle assignée",
      });
    }

    allowedOrgIds = assignments.map((a) => a.organization_id);
  }

  // Load survey
  const { data: survey } = await admin
    .from("surveys")
    .select("id, title_fr, title_en, status, distribution_mode, open_self_declaration_fields")
    .eq("id", surveyId)
    .single();

  if (!survey) {
    return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });
  }

  const isOpenMode = survey.distribution_mode === "open";
  let totalResponses = 0;
  let answerSourceFilter: { column: string; ids: string[] } | null = null;

  if (isOpenMode) {
    // ── Open mode: query open_responses ──
    let openQuery = admin
      .from("open_responses")
      .select("id, sexe, fonction, lieu_travail, type_contrat, temps_travail, cost_center, direction, departement, service")
      .eq("survey_id", surveyId);

    // Apply self-declaration demographic filters directly
    if (sexe) openQuery = openQuery.eq("sexe", sexe);
    if (fonction) openQuery = openQuery.eq("fonction", fonction);
    if (lieuTravail) openQuery = openQuery.eq("lieu_travail", lieuTravail);
    if (typeContrat) openQuery = openQuery.eq("type_contrat", typeContrat);
    if (tempsTravail) openQuery = openQuery.eq("temps_travail", tempsTravail);
    if (costCenter) openQuery = openQuery.eq("cost_center", costCenter);
    // Text-based org filters for open mode
    if (searchParams.get("open_direction")) openQuery = openQuery.eq("direction", searchParams.get("open_direction")!);
    if (searchParams.get("open_departement")) openQuery = openQuery.eq("departement", searchParams.get("open_departement")!);
    if (searchParams.get("open_service")) openQuery = openQuery.eq("service", searchParams.get("open_service")!);

    const { data: openResponses } = await openQuery;
    totalResponses = openResponses?.length || 0;

    if (totalResponses < ANONYMITY_THRESHOLD) {
      return NextResponse.json({
        survey: { id: survey.id, title_fr: survey.title_fr, title_en: survey.title_en, distribution_mode: survey.distribution_mode },
        totalResponses,
        questions: [],
        anonymityBlocked: true,
        message: `Résultats masqués : moins de ${ANONYMITY_THRESHOLD} répondants (${totalResponses} reçus)`,
      });
    }

    answerSourceFilter = { column: "open_response_id", ids: openResponses!.map((r) => r.id) };
  } else {
    // ── Token mode (existing behavior) ──
    let responsesQuery = admin
      .from("responses")
      .select("id, societe_id, direction_id, department_id, service_id")
      .eq("survey_id", surveyId);

    if (societeId) responsesQuery = responsesQuery.eq("societe_id", societeId);
    if (directionId) responsesQuery = responsesQuery.eq("direction_id", directionId);
    if (departmentId) responsesQuery = responsesQuery.eq("department_id", departmentId);
    if (serviceId) responsesQuery = responsesQuery.eq("service_id", serviceId);

    // Demographic filters: find matching token_ids first, then filter responses
    const hasDemographicFilters = sexe || fonction || lieuTravail || typeContrat || tempsTravail || costCenter || ageMin || ageMax || seniorityMin || seniorityMax;

    if (hasDemographicFilters) {
      let tokenQuery = admin
        .from("anonymous_tokens")
        .select("id, date_naissance, date_entree")
        .eq("active", true);

      if (sexe) tokenQuery = tokenQuery.eq("sexe", sexe);
      if (fonction) tokenQuery = tokenQuery.eq("fonction", fonction);
      if (lieuTravail) tokenQuery = tokenQuery.eq("lieu_travail", lieuTravail);
      if (typeContrat) tokenQuery = tokenQuery.eq("type_contrat", typeContrat);
      if (tempsTravail) tokenQuery = tokenQuery.eq("temps_travail", tempsTravail);
      if (costCenter) tokenQuery = tokenQuery.eq("cost_center", costCenter);

      const { data: matchingTokens } = await tokenQuery;

      if (matchingTokens) {
        let filtered = matchingTokens;
        const now = new Date();

        if (ageMin || ageMax) {
          filtered = filtered.filter((t) => {
            if (!t.date_naissance) return false;
            const birth = new Date(t.date_naissance);
            let age = now.getFullYear() - birth.getFullYear();
            const m = now.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
            if (ageMin && age < Number(ageMin)) return false;
            if (ageMax && age > Number(ageMax)) return false;
            return true;
          });
        }

        if (seniorityMin || seniorityMax) {
          filtered = filtered.filter((t) => {
            if (!t.date_entree) return false;
            const entry = new Date(t.date_entree);
            let years = now.getFullYear() - entry.getFullYear();
            const m = now.getMonth() - entry.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < entry.getDate())) years--;
            if (seniorityMin && years < Number(seniorityMin)) return false;
            if (seniorityMax && years > Number(seniorityMax)) return false;
            return true;
          });
        }

        const matchingTokenIds = filtered.map((t) => t.id);
        if (matchingTokenIds.length > 0) {
          responsesQuery = responsesQuery.in("token_id", matchingTokenIds);
        } else {
          return NextResponse.json({
            survey: { id: survey.id, title_fr: survey.title_fr, title_en: survey.title_en, distribution_mode: survey.distribution_mode },
            totalResponses: 0,
            sections: [],
            questions: [],
            organizations: [],
            demographicOptions: {},
            anonymityBlocked: false,
          });
        }
      }
    }

    // For managers, filter by allowed orgs
    if (allowedOrgIds) {
      responsesQuery = responsesQuery.or(
        `societe_id.in.(${allowedOrgIds.join(",")}),direction_id.in.(${allowedOrgIds.join(",")}),department_id.in.(${allowedOrgIds.join(",")}),service_id.in.(${allowedOrgIds.join(",")})`
      );
    }

    const { data: responses } = await responsesQuery;
    totalResponses = responses?.length || 0;

    if (totalResponses < ANONYMITY_THRESHOLD) {
      return NextResponse.json({
        survey: { id: survey.id, title_fr: survey.title_fr, title_en: survey.title_en, distribution_mode: survey.distribution_mode },
        totalResponses,
        questions: [],
        anonymityBlocked: true,
        message: `Résultats masqués : moins de ${ANONYMITY_THRESHOLD} répondants (${totalResponses} reçus)`,
      });
    }

    answerSourceFilter = { column: "response_id", ids: responses!.map((r) => r.id) };
  }

  // Load sections
  const { data: sectionRows } = await admin
    .from("survey_sections")
    .select("id, title_fr, sort_order")
    .eq("survey_id", surveyId)
    .order("sort_order");

  // Load questions
  const { data: questions } = await admin
    .from("questions")
    .select("id, type, text_fr, text_en, sort_order, section_id, scale_variant, scale_min_label_fr, scale_min_label_en, scale_max_label_fr, scale_max_label_en, question_options(id, text_fr, text_en, sort_order)")
    .eq("survey_id", surveyId)
    .order("sort_order");

  if (!questions) {
    return NextResponse.json({ error: "Erreur chargement questions" }, { status: 500 });
  }

  // Load all answers for these responses
  const { data: allAnswers } = await admin
    .from("answers")
    .select("question_id, numeric_value, text_value, selected_option_ids")
    .in(answerSourceFilter!.column, answerSourceFilter!.ids);

  // Aggregate per question
  const questionResults = questions.map((q) => {
    const qAnswers = (allAnswers || []).filter(
      (a) => a.question_id === q.id
    );
    const options = ((q.question_options as { id: string; text_fr: string; text_en: string | null; sort_order: number }[]) || []).sort(
      (a, b) => a.sort_order - b.sort_order
    );

    let aggregation: Record<string, unknown> = {};

    if (q.type === "single_choice" || q.type === "multiple_choice") {
      // Count per option
      const optionCounts: Record<string, number> = {};
      options.forEach((o) => (optionCounts[o.id] = 0));

      qAnswers.forEach((a) => {
        if (a.selected_option_ids) {
          (a.selected_option_ids as string[]).forEach((optId) => {
            optionCounts[optId] = (optionCounts[optId] || 0) + 1;
          });
        }
      });

      aggregation = {
        type: q.type,
        options: options.map((o) => ({
          id: o.id,
          text_fr: o.text_fr,
          text_en: o.text_en,
          count: optionCounts[o.id] || 0,
          percentage:
            qAnswers.length > 0
              ? Math.round(((optionCounts[o.id] || 0) / qAnswers.length) * 100)
              : 0,
        })),
        totalAnswers: qAnswers.length,
      };
    } else if (q.type === "likert" || q.type === "likert_5") {
      const maxScale = q.type === "likert_5" ? 5 : 10;
      const values = qAnswers
        .filter((a) => a.numeric_value !== null)
        .map((a) => a.numeric_value as number);

      const distribution: Record<number, number> = {};
      for (let i = 1; i <= maxScale; i++) distribution[i] = 0;
      values.forEach((v) => (distribution[v] = (distribution[v] || 0) + 1));

      const avg =
        values.length > 0
          ? values.reduce((s, v) => s + v, 0) / values.length
          : 0;

      aggregation = {
        type: q.type,
        average: Math.round(avg * 10) / 10,
        distribution: Object.entries(distribution).map(([val, count]) => ({
          value: Number(val),
          count,
        })),
        totalAnswers: values.length,
      };
    } else if (q.type === "free_text") {
      aggregation = {
        type: "free_text",
        responses: qAnswers
          .filter((a) => a.text_value?.trim())
          .map((a) => a.text_value),
        totalAnswers: qAnswers.filter((a) => a.text_value?.trim()).length,
      };
    }

    const qRow = q as Record<string, unknown>;
    return {
      id: q.id,
      type: q.type,
      text_fr: q.text_fr,
      text_en: q.text_en,
      sort_order: q.sort_order,
      section_id: qRow.section_id || null,
      scale_variant: (qRow.scale_variant as string | null) || "agreement",
      scale_min_label_fr: (qRow.scale_min_label_fr as string | null) || null,
      scale_min_label_en: (qRow.scale_min_label_en as string | null) || null,
      scale_max_label_fr: (qRow.scale_max_label_fr as string | null) || null,
      scale_max_label_en: (qRow.scale_max_label_en as string | null) || null,
      ...aggregation,
    };
  });

  // Get demographic filter options and org data
  let demographicOptions: Record<string, string[]> = {};
  let orgs: { id: string; name: string; type: string; parent_id: string | null }[] = [];

  if (isOpenMode) {
    // Open mode: get distinct values from open_responses for this survey
    const { data: openDemoData } = await admin
      .from("open_responses")
      .select("sexe, fonction, lieu_travail, type_contrat, temps_travail, cost_center, direction, departement, service")
      .eq("survey_id", surveyId);

    if (openDemoData) {
      const distinct = (key: string) => {
        const values = new Set<string>();
        openDemoData.forEach((t: Record<string, unknown>) => {
          const v = t[key];
          if (v != null && v !== "") values.add(String(v));
        });
        return Array.from(values).sort();
      };

      // Only include fields that were configured for self-declaration
      const declFields = (survey.open_self_declaration_fields as string[]) || [];
      if (declFields.includes("sexe")) demographicOptions.sexe = distinct("sexe");
      if (declFields.includes("fonction")) demographicOptions.fonctions = distinct("fonction");
      if (declFields.includes("lieu_travail")) demographicOptions.lieux_travail = distinct("lieu_travail");
      if (declFields.includes("type_contrat")) demographicOptions.types_contrat = distinct("type_contrat");
      if (declFields.includes("temps_travail")) demographicOptions.temps_travail = distinct("temps_travail");
      if (declFields.includes("cost_center")) demographicOptions.cost_centers = distinct("cost_center");
      // Text-based org filters for open mode
      if (declFields.includes("direction")) demographicOptions.open_directions = distinct("direction");
      if (declFields.includes("departement")) demographicOptions.open_departements = distinct("departement");
      if (declFields.includes("service")) demographicOptions.open_services = distinct("service");
    }
  } else {
    // Token mode: existing org + demographic filter logic
    const { data: orgData } = await admin
      .from("organizations")
      .select("id, name, type, parent_id")
      .order("name");

    orgs = orgData || [];

    const { data: surveyData } = await admin
      .from("surveys")
      .select("societe_id")
      .eq("id", surveyId)
      .single();

    let demoQuery = admin
      .from("anonymous_tokens")
      .select("sexe, fonction, lieu_travail, type_contrat, temps_travail, cost_center, date_naissance, date_entree")
      .eq("active", true);

    if (surveyData?.societe_id) {
      demoQuery = demoQuery.eq("societe_id", surveyData.societe_id);
    }

    const { data: demoTokens } = await demoQuery;

    if (demoTokens) {
      const distinct = (key: string) => {
        const values = new Set<string>();
        demoTokens.forEach((t: Record<string, unknown>) => {
          const v = t[key];
          if (v != null && v !== "") values.add(String(v));
        });
        return Array.from(values).sort();
      };

      demographicOptions = {
        sexe: distinct("sexe"),
        fonctions: distinct("fonction"),
        lieux_travail: distinct("lieu_travail"),
        types_contrat: distinct("type_contrat"),
        temps_travail: distinct("temps_travail"),
        cost_centers: distinct("cost_center"),
      };

      if (demoTokens.some((t: Record<string, unknown>) => t.date_naissance != null)) {
        demographicOptions.hasDateNaissance = ["true"];
      }
      if (demoTokens.some((t: Record<string, unknown>) => t.date_entree != null)) {
        demographicOptions.hasDateEntree = ["true"];
      }
    }
  }

  return NextResponse.json({
    survey: {
      id: survey.id,
      title_fr: survey.title_fr,
      title_en: survey.title_en,
      distribution_mode: survey.distribution_mode,
    },
    totalResponses,
    sections: sectionRows || [],
    questions: questionResults,
    organizations: orgs,
    demographicOptions,
    anonymityBlocked: false,
  });
}
