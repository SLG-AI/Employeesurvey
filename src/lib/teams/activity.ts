import type { TeamsMessageType } from "./templates";

const GRAPH = "https://graph.microsoft.com/v1.0";

// Teams app (manifest) id — used to build deep links. Override via env if the
// app is ever re-registered under a different id.
const TEAMS_APP_ID =
  process.env.TEAMS_APP_MANIFEST_ID || "478e9d1c-39e1-4a6b-8b9a-0003135f2b47";

/**
 * Activity notifications require `topic.webUrl` to be a Microsoft Teams deep
 * link (teams.microsoft.com/l/...), NOT an arbitrary external URL. We wrap the
 * survey URL in a stage-view deep link, which opens it inside Teams — allowed
 * because the survey domain is declared in the app manifest `validDomains`.
 */
function buildSurveyDeepLink(surveyLink: string): string {
  const context = encodeURIComponent(
    JSON.stringify({
      contentUrl: surveyLink,
      websiteUrl: surveyLink,
      name: "Sondage",
    })
  );
  return `https://teams.microsoft.com/l/stage/${TEAMS_APP_ID}/0?context=${context}`;
}

/**
 * Teams activity-feed notifications (sendActivityNotification).
 *
 * Why this exists: the app is pre-installed org-wide by the tenant admin, which
 * never fires `installationUpdate` to the bot — so most users have no stored
 * conversation reference and the bot cannot proactively message them until they
 * first interact ("bonjour"). Activity notifications need NO conversation
 * reference: they only require the app to be installed for the user (it is, for
 * everyone), so they reach the ~80% the bot path misses.
 *
 * Gated behind TEAMS_ACTIVITY_NOTIFY so the code stays inert until the
 * `TeamsActivity.Send` application permission has been consented in the tenant.
 * (Without consent, every call would 403.)
 */
export function isActivityNotifyConfigured(): boolean {
  return (
    process.env.TEAMS_ACTIVITY_NOTIFY === "true" &&
    !!process.env.AZURE_TENANT_ID &&
    !!process.env.AZURE_CLIENT_ID &&
    !!process.env.AZURE_CLIENT_SECRET
  );
}

let cachedGraphToken: { token: string; expiresAt: number } | null = null;

async function getGraphAppToken(): Promise<string> {
  if (cachedGraphToken && Date.now() < cachedGraphToken.expiresAt - 60_000) {
    return cachedGraphToken.token;
  }
  const tenant = process.env.AZURE_TENANT_ID!;
  const res = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID!,
        client_secret: process.env.AZURE_CLIENT_SECRET!,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }).toString(),
    }
  );
  if (!res.ok) {
    throw new Error(`Graph token error: ${await res.text()}`);
  }
  const data = await res.json();
  cachedGraphToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return cachedGraphToken.token;
}

/**
 * Resolve a roster email to an Azure AD object id.
 *
 * Roster emails are `mail` values (e.g. firstname.lastname@), which differ from
 * the UPN (e.g. initials@). `GET /users/{mail}` therefore 404s — resolution
 * MUST go through $filter with ConsistencyLevel: eventual.
 */
async function resolveAadId(token: string, email: string): Promise<string | null> {
  const safe = email.replace(/'/g, "''");
  const filter = encodeURIComponent(
    `mail eq '${safe}' or userPrincipalName eq '${safe}'`
  );
  const res = await fetch(
    `${GRAPH}/users?$filter=${filter}&$select=id&$top=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        ConsistencyLevel: "eventual",
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.value?.[0]?.id ?? null;
}

async function sendOne(
  token: string,
  aadId: string,
  topicTitle: string,
  previewText: string,
  surveyLink: string
): Promise<void> {
  const res = await fetch(
    `${GRAPH}/users/${aadId}/teamwork/sendActivityNotification`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // `text` source + a Teams stage-view deep link (webUrl must be a Teams
        // deep link, not a raw external URL).
        topic: {
          source: "text",
          value: topicTitle,
          webUrl: buildSurveyDeepLink(surveyLink),
        },
        // `systemDefault` is the reserved type that accepts free text with no
        // manifest activityType declaration required.
        activityType: "systemDefault",
        previewText: { content: previewText },
        templateParameters: [{ name: "systemDefaultText", value: previewText }],
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }
}

export interface ActivityRecipient {
  email: string;
  employeeName: string;
  surveyLink: string;
}

export interface ActivityResult {
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Send Teams activity-feed notifications to recipients (resolved by email).
 * No-op (returns zeros) when not configured. Honours TEAMS_ACTIVITY_DRY_RUN to
 * resolve + log without actually delivering.
 */
export async function sendActivityNotifications(
  recipients: ActivityRecipient[],
  surveyTitle: string,
  type: TeamsMessageType
): Promise<ActivityResult> {
  const result: ActivityResult = { sent: 0, failed: 0, errors: [] };
  if (recipients.length === 0 || !isActivityNotifyConfigured()) return result;

  const dryRun = process.env.TEAMS_ACTIVITY_DRY_RUN === "true";
  const token = await getGraphAppToken();
  const topicTitle =
    type === "invitation" ? "Nouveau sondage" : "Rappel sondage";

  for (const r of recipients) {
    try {
      const aadId = await resolveAadId(token, r.email);
      if (!aadId) {
        result.failed++;
        result.errors.push({
          email: r.email,
          error: "Utilisateur introuvable dans Azure AD",
        });
        continue;
      }

      const preview =
        type === "invitation"
          ? `${r.employeeName}, un nouveau sondage vous attend : ${surveyTitle}`
          : `${r.employeeName}, rappel : merci de répondre au sondage ${surveyTitle}`;

      if (dryRun) {
        console.log(
          "[Teams Activity][dry-run]",
          r.email,
          "->",
          aadId,
          "|",
          preview
        );
        result.sent++;
      } else {
        await sendOne(token, aadId, topicTitle, preview, r.surveyLink);
        result.sent++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        email: r.email,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }

    // Respect Graph throttling limits.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return result;
}
