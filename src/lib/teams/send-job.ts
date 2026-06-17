// Shared Teams send-job logic, used by BOTH the Next.js API routes and the
// standalone Netlify Background Function worker. It therefore MUST use relative
// imports only (no "@/" path aliases), because the worker is bundled by
// Netlify's esbuild outside the Next.js build, where "@/" does not resolve.

import { createAdminClient } from "../supabase/admin";
import { sendTeamsMessages } from "./graph";
import { selectRecipients, type SendMode } from "../surveys/recipient-selector";
import { generateSurveyLink } from "../utils/token";

const WORKER_PATH = "/.netlify/functions/teams-send-worker-background";

type AdminClient = ReturnType<typeof createAdminClient>;

function messageTypeForMode(mode: SendMode): "invitation" | "reminder" {
  return mode === "never_invited" ? "invitation" : "reminder";
}

/**
 * Create a queued Teams send job. Returns the new job id.
 */
export async function createTeamsJob(
  admin: AdminClient,
  params: {
    surveyId: string;
    mode: SendMode;
    tokenIds?: string[];
    createdBy?: string | null;
  }
): Promise<string> {
  const { data, error } = await admin
    .from("teams_send_jobs")
    .insert({
      survey_id: params.surveyId,
      mode: params.mode,
      message_type: messageTypeForMode(params.mode),
      token_ids: params.mode === "manual" ? (params.tokenIds ?? []) : null,
      status: "queued",
      created_by: params.createdBy ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Impossible de créer le job d'envoi Teams");
  }
  return data.id as string;
}

/**
 * Fire the Netlify Background Function that processes a job. Returns true if the
 * worker accepted the request (HTTP 202). When false, the caller should fall
 * back to processing inline (e.g. local dev where the function is unavailable).
 */
export async function triggerTeamsWorker(
  jobId: string,
  origin: string
): Promise<boolean> {
  const secret = process.env.TEAMS_WORKER_SECRET;
  try {
    const res = await fetch(`${origin}${WORKER_PATH}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(secret ? { "x-teams-worker-secret": secret } : {}),
      },
      body: JSON.stringify({ jobId }),
    });
    // Background functions reply 202 Accepted; tolerate any 2xx.
    return res.status === 202 || res.ok;
  } catch {
    return false;
  }
}

/**
 * Process a Teams send job: claim it, resolve recipients, send messages and
 * record delivery incrementally. Safe to call from the worker or inline.
 * Creates its own admin client so it has no dependency on request context.
 */
export async function processTeamsJob(jobId: string): Promise<void> {
  const admin = createAdminClient();
  const nowIso = () => new Date().toISOString();

  // Atomically claim the job: only one processor wins the queued → running
  // transition, so duplicate triggers are no-ops.
  const { data: job } = await admin
    .from("teams_send_jobs")
    .update({ status: "running", started_at: nowIso(), updated_at: nowIso() })
    .eq("id", jobId)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();

  if (!job) return; // already claimed / not found

  try {
    const { data: survey } = await admin
      .from("surveys")
      .select("title_fr, status")
      .eq("id", job.survey_id)
      .single();

    if (!survey) throw new Error("Sondage introuvable");
    if (survey.status !== "published") {
      throw new Error("Le sondage doit être publié pour envoyer");
    }

    const selection = await selectRecipients(admin, {
      surveyId: job.survey_id,
      mode: job.mode as SendMode,
      tokenIds: (job.token_ids as string[] | null) ?? undefined,
    });
    if (!selection.ok) throw new Error(selection.error);

    const emailTokens = selection.tokens.filter((t) => !!t.email);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "";

    const recipients = emailTokens.map((t) => ({
      email: t.email!,
      employeeName: t.employee_name || "Collaborateur",
      surveyLink: generateSurveyLink(baseUrl, job.survey_id, t.token),
    }));

    await admin
      .from("teams_send_jobs")
      .update({ total: recipients.length, updated_at: nowIso() })
      .eq("id", jobId);

    if (recipients.length === 0) {
      await admin
        .from("teams_send_jobs")
        .update({ status: "done", finished_at: nowIso(), updated_at: nowIso() })
        .eq("id", jobId);
      return;
    }

    const columnToUpdate =
      job.message_type === "invitation"
        ? "teams_invitation_sent_at"
        : "teams_reminder_sent_at";

    const tokenIdByEmail = new Map<string, string>();
    for (const t of emailTokens) {
      tokenIdByEmail.set(t.email!.toLowerCase(), t.id);
    }

    let sentCount = 0;
    const markSent = async (email: string) => {
      const tokenId = tokenIdByEmail.get(email.toLowerCase());
      if (tokenId) {
        try {
          if (selection.useSurveyTokens) {
            await admin
              .from("survey_tokens")
              .update({ [columnToUpdate]: nowIso() })
              .eq("survey_id", job.survey_id)
              .eq("token_id", tokenId);
          } else {
            await admin
              .from("anonymous_tokens")
              .update({ [columnToUpdate]: nowIso() })
              .eq("id", tokenId);
          }
        } catch (err) {
          console.error("[Teams job] Failed to mark sent for", email, err);
        }
      }
      // Surface live progress to the polling UI (batched to limit writes).
      sentCount++;
      if (sentCount % 5 === 0) {
        await admin
          .from("teams_send_jobs")
          .update({ sent: sentCount, updated_at: nowIso() })
          .eq("id", jobId);
      }
    };

    const result = await sendTeamsMessages(
      recipients,
      survey.title_fr,
      job.message_type as "invitation" | "reminder",
      markSent
    );

    await admin
      .from("teams_send_jobs")
      .update({
        status: "done",
        sent: result.sent,
        failed: result.failed,
        not_installed: result.notInstalled ?? 0,
        errors: result.errors,
        finished_at: nowIso(),
        updated_at: nowIso(),
      })
      .eq("id", jobId);
  } catch (error) {
    await admin
      .from("teams_send_jobs")
      .update({
        status: "error",
        error_message:
          error instanceof Error ? error.message : "Erreur inconnue",
        finished_at: nowIso(),
        updated_at: nowIso(),
      })
      .eq("id", jobId);
  }
}
