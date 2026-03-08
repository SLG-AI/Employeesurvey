import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: surveyId } = await params;
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { token, answers, respondent_fingerprint, self_declaration } = body as {
      token?: string;
      answers: {
        question_id: string;
        numeric_value?: number;
        text_value?: string;
        selected_option_ids?: string[];
      }[];
      respondent_fingerprint?: string;
      self_declaration?: Record<string, string>;
    };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Aucune réponse fournie" },
        { status: 400 }
      );
    }

    // Load survey
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("id, status, distribution_mode, open_self_declaration_fields")
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
        { error: "Ce sondage n'est pas ouvert aux réponses" },
        { status: 400 }
      );
    }

    // ── Open mode ──
    if (survey.distribution_mode === "open") {
      if (!respondent_fingerprint) {
        return NextResponse.json(
          { error: "Identifiant de session manquant" },
          { status: 400 }
        );
      }

      // Check duplicate
      const { data: existingOpen } = await supabase
        .from("open_responses")
        .select("id")
        .eq("survey_id", surveyId)
        .eq("respondent_fingerprint", respondent_fingerprint)
        .single();

      if (existingOpen) {
        return NextResponse.json(
          { error: "Vous avez déjà répondu à ce sondage" },
          { status: 409 }
        );
      }

      // Build self-declaration row
      const sd = self_declaration || {};
      const { data: openResponse, error: openError } = await supabase
        .from("open_responses")
        .insert({
          survey_id: surveyId,
          respondent_fingerprint,
          sexe: sd.sexe || null,
          fonction: sd.fonction || null,
          lieu_travail: sd.lieu_travail || null,
          type_contrat: sd.type_contrat || null,
          temps_travail: sd.temps_travail || null,
          cost_center: sd.cost_center || null,
          direction: sd.direction || null,
          departement: sd.departement || null,
          service: sd.service || null,
        })
        .select("id")
        .single();

      if (openError || !openResponse) {
        return NextResponse.json(
          { error: "Erreur lors de l'enregistrement" },
          { status: 500 }
        );
      }

      const answersToInsert = answers.map((a) => ({
        open_response_id: openResponse.id,
        question_id: a.question_id,
        numeric_value: a.numeric_value ?? null,
        text_value: a.text_value ?? null,
        selected_option_ids: a.selected_option_ids ?? null,
      }));

      const { error: answersError } = await supabase
        .from("answers")
        .insert(answersToInsert);

      if (answersError) {
        await supabase.from("open_responses").delete().eq("id", openResponse.id);
        return NextResponse.json(
          { error: "Erreur lors de l'enregistrement des réponses" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // ── Token mode (existing behavior) ──
    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    // Validate token (must be active)
    const { data: tokenData, error: tokenError } = await supabase
      .from("anonymous_tokens")
      .select("id, societe_id, direction_id, department_id, service_id")
      .eq("token", token.trim())
      .eq("active", true)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 403 }
      );
    }

    // Check if token already submitted for this survey
    const { data: existingResponse } = await supabase
      .from("responses")
      .select("id")
      .eq("survey_id", surveyId)
      .eq("token_id", tokenData.id)
      .single();

    if (existingResponse) {
      return NextResponse.json(
        { error: "Vous avez déjà répondu à ce sondage" },
        { status: 409 }
      );
    }

    // Verify token is allowed for this survey (via survey_tokens)
    const { count: surveyTokenCount } = await supabase
      .from("survey_tokens")
      .select("id", { count: "exact", head: true })
      .eq("survey_id", surveyId);

    if (surveyTokenCount && surveyTokenCount > 0) {
      const { data: surveyToken } = await supabase
        .from("survey_tokens")
        .select("id")
        .eq("survey_id", surveyId)
        .eq("token_id", tokenData.id)
        .single();

      if (!surveyToken) {
        return NextResponse.json(
          { error: "Token non autorisé pour ce sondage" },
          { status: 403 }
        );
      }
    }

    // Create response
    const { data: response, error: responseError } = await supabase
      .from("responses")
      .insert({
        survey_id: surveyId,
        token_id: tokenData.id,
        societe_id: tokenData.societe_id,
        direction_id: tokenData.direction_id,
        department_id: tokenData.department_id,
        service_id: tokenData.service_id,
      })
      .select("id")
      .single();

    if (responseError || !response) {
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement" },
        { status: 500 }
      );
    }

    // Insert answers
    const answersToInsert = answers.map((a) => ({
      response_id: response.id,
      question_id: a.question_id,
      numeric_value: a.numeric_value ?? null,
      text_value: a.text_value ?? null,
      selected_option_ids: a.selected_option_ids ?? null,
    }));

    const { error: answersError } = await supabase
      .from("answers")
      .insert(answersToInsert);

    if (answersError) {
      await supabase.from("responses").delete().eq("id", response.id);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement des réponses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
