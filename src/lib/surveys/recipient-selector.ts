import type { SupabaseClient } from "@supabase/supabase-js";

export type SendMode = "non_responders" | "never_invited" | "manual" | "all";

export type RecipientToken = {
  id: string;
  token: string;
  email: string | null;
  phone: string | null;
  employee_name: string | null;
  survey_token_id: string | null;
  invitation_sent_at: string | null;
  reminder_sent_at: string | null;
  teams_invitation_sent_at: string | null;
  teams_reminder_sent_at: string | null;
  phone_invitation_sent_at: string | null;
  phone_reminder_sent_at: string | null;
  responded: boolean;
};

export type SelectorSuccess = {
  ok: true;
  useSurveyTokens: boolean;
  tokens: RecipientToken[];
};

export type SelectorFailure = {
  ok: false;
  status: number;
  error: string;
};

export type SelectorResult = SelectorSuccess | SelectorFailure;

export type SelectorInput = {
  surveyId: string;
  mode: SendMode;
  tokenIds?: string[];
};

type SurveyTokenRow = {
  token_id: string;
  invitation_sent_at: string | null;
  reminder_sent_at: string | null;
  teams_invitation_sent_at: string | null;
  teams_reminder_sent_at: string | null;
  phone_invitation_sent_at: string | null;
  phone_reminder_sent_at: string | null;
  anonymous_tokens: {
    id: string;
    token: string;
    email: string | null;
    phone: string | null;
    employee_name: string | null;
    active: boolean;
  } | null;
};

type AnonTokenRow = {
  id: string;
  token: string;
  email: string | null;
  phone: string | null;
  employee_name: string | null;
  invitation_sent_at: string | null;
  reminder_sent_at: string | null;
  teams_invitation_sent_at: string | null;
  teams_reminder_sent_at: string | null;
  phone_invitation_sent_at: string | null;
  phone_reminder_sent_at: string | null;
};

export async function selectRecipients(
  admin: SupabaseClient,
  input: SelectorInput
): Promise<SelectorResult> {
  const { surveyId, mode, tokenIds } = input;

  if (mode === "manual" && (!tokenIds || tokenIds.length === 0)) {
    return {
      ok: false,
      status: 400,
      error: "tokenIds requis en mode 'manual'",
    };
  }

  const { data: survey, error: surveyErr } = await admin
    .from("surveys")
    .select("societe_id")
    .eq("id", surveyId)
    .single();

  if (surveyErr || !survey) {
    return { ok: false, status: 404, error: "Sondage introuvable" };
  }

  const { count: stCount } = await admin
    .from("survey_tokens")
    .select("id", { count: "exact", head: true })
    .eq("survey_id", surveyId);

  const useSurveyTokens = (stCount ?? 0) > 0;

  const { data: responses } = await admin
    .from("responses")
    .select("token_id")
    .eq("survey_id", surveyId);
  const respondedIds = new Set((responses ?? []).map((r) => r.token_id));

  if (useSurveyTokens) {
    let q = admin
      .from("survey_tokens")
      .select(
        "token_id,invitation_sent_at,reminder_sent_at,teams_invitation_sent_at,teams_reminder_sent_at,phone_invitation_sent_at,phone_reminder_sent_at,anonymous_tokens!inner(id,token,email,phone,employee_name,active)"
      )
      .eq("survey_id", surveyId);

    if (mode === "manual") {
      q = q.in("token_id", tokenIds!);
    }

    const { data, error } = await q;
    if (error) {
      return { ok: false, status: 500, error: "Erreur lors de la sélection" };
    }

    let rows = ((data as unknown as SurveyTokenRow[]) ?? []).filter(
      (r) => r.anonymous_tokens?.active
    );

    if (mode === "non_responders") {
      rows = rows.filter(
        (r) =>
          (r.invitation_sent_at !== null ||
            r.teams_invitation_sent_at !== null ||
            r.phone_invitation_sent_at !== null) &&
          r.anonymous_tokens &&
          !respondedIds.has(r.anonymous_tokens.id)
      );
    } else if (mode === "never_invited") {
      rows = rows.filter(
        (r) =>
          r.invitation_sent_at === null &&
          r.teams_invitation_sent_at === null &&
          r.phone_invitation_sent_at === null
      );
    }

    const tokens: RecipientToken[] = rows
      .filter((r) => r.anonymous_tokens)
      .map((r) => {
        const at = r.anonymous_tokens!;
        return {
          id: at.id,
          token: at.token,
          email: at.email,
          phone: at.phone,
          employee_name: at.employee_name,
          survey_token_id: r.token_id,
          invitation_sent_at: r.invitation_sent_at,
          reminder_sent_at: r.reminder_sent_at,
          teams_invitation_sent_at: r.teams_invitation_sent_at,
          teams_reminder_sent_at: r.teams_reminder_sent_at,
          phone_invitation_sent_at: r.phone_invitation_sent_at,
          phone_reminder_sent_at: r.phone_reminder_sent_at,
          responded: respondedIds.has(at.id),
        };
      });

    return { ok: true, useSurveyTokens: true, tokens };
  }

  // Legacy flow: anonymous_tokens scoped by societe_id
  let q = admin
    .from("anonymous_tokens")
    .select(
      "id,token,email,phone,employee_name,invitation_sent_at,reminder_sent_at,teams_invitation_sent_at,teams_reminder_sent_at,phone_invitation_sent_at,phone_reminder_sent_at"
    )
    .eq("active", true);

  if (survey.societe_id) {
    q = q.eq("societe_id", survey.societe_id);
  }

  if (mode === "manual") {
    q = q.in("id", tokenIds!);
  }

  const { data, error } = await q;
  if (error) {
    return { ok: false, status: 500, error: "Erreur lors de la sélection" };
  }

  let rows = (data as AnonTokenRow[] | null) ?? [];

  if (mode === "non_responders") {
    rows = rows.filter(
      (r) =>
        (r.invitation_sent_at !== null ||
          r.teams_invitation_sent_at !== null ||
          r.phone_invitation_sent_at !== null) &&
        !respondedIds.has(r.id)
    );
  } else if (mode === "never_invited") {
    rows = rows.filter(
      (r) =>
        r.invitation_sent_at === null &&
        r.teams_invitation_sent_at === null &&
        r.phone_invitation_sent_at === null
    );
  }

  const tokens: RecipientToken[] = rows.map((r) => ({
    id: r.id,
    token: r.token,
    email: r.email,
    phone: r.phone,
    employee_name: r.employee_name,
    survey_token_id: null,
    invitation_sent_at: r.invitation_sent_at,
    reminder_sent_at: r.reminder_sent_at,
    teams_invitation_sent_at: r.teams_invitation_sent_at,
    teams_reminder_sent_at: r.teams_reminder_sent_at,
    phone_invitation_sent_at: r.phone_invitation_sent_at,
    phone_reminder_sent_at: r.phone_reminder_sent_at,
    responded: respondedIds.has(r.id),
  }));

  return { ok: true, useSurveyTokens: false, tokens };
}

/**
 * For a list of recipients, returns the subset of token IDs whose owner has
 * installed the Teams bot (via teams_bot_installations keyed by lowercased
 * email).
 */
export async function markTeamsAvailability(
  admin: SupabaseClient,
  recipients: RecipientToken[]
): Promise<Set<string>> {
  const emails = recipients
    .map((r) => r.email?.toLowerCase())
    .filter((v): v is string => !!v);
  if (emails.length === 0) return new Set();

  const { data } = await admin
    .from("teams_bot_installations")
    .select("user_email")
    .in("user_email", emails);

  const installedEmails = new Set(
    ((data ?? []) as { user_email: string }[]).map((r) =>
      r.user_email.toLowerCase()
    )
  );

  const installedTokenIds = new Set<string>();
  for (const r of recipients) {
    if (r.email && installedEmails.has(r.email.toLowerCase())) {
      installedTokenIds.add(r.id);
    }
  }
  return installedTokenIds;
}
