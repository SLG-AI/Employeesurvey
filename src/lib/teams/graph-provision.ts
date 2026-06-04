/**
 * Proactive Teams app provisioning via Microsoft Graph.
 *
 * Goal: be able to send a proactive Teams message to an employee WITHOUT
 * requiring them to first open a chat with the bot ("hello"). The Bot
 * Framework only needs a conversation reference, which is created when the
 * app is *installed* in the user's personal scope. This module installs the
 * app silently via Graph and retrieves the resulting 1:1 chat so we can build
 * that conversation reference ourselves.
 *
 * Flow (per user):
 *   1. Resolve the user's AAD id from their email.
 *   2. Ensure the PulseSurvey app is installed in their personal scope
 *      (idempotent — a 409 "already installed" is treated as success).
 *   3. Fetch the installed app's 1:1 chat to obtain the conversation id.
 *
 * Azure prerequisites (admin consent required — NOT handled by code):
 *   - Application permissions on the app behind AZURE_CLIENT_ID:
 *       • TeamsAppInstallation.ReadWriteForUser.All  (install + read chat)
 *       • User.Read.All                              (resolve user by email)
 *   - The PulseSurvey app must be published to the org Teams app catalog so
 *     it has a catalog app id (set as TEAMS_CATALOG_APP_ID).
 *
 * Required env:
 *   - AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
 *   - TEAMS_CATALOG_APP_ID  (the app id in the org Teams catalog)
 */

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export interface ProvisionedConversation {
  conversationId: string;
  aadId: string;
}

export function isGraphProvisioningConfigured(): boolean {
  return !!(
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET &&
    process.env.TEAMS_CATALOG_APP_ID
  );
}

/** Acquire an application (client_credentials) token for Microsoft Graph. */
async function getGraphToken(): Promise<string> {
  const tenantId = process.env.AZURE_TENANT_ID!;
  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.AZURE_CLIENT_ID!,
        client_secret: process.env.AZURE_CLIENT_SECRET!,
        scope: "https://graph.microsoft.com/.default",
      }).toString(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Graph auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

/**
 * Resolve a user's AAD object id from their email. Tries a direct lookup by
 * UPN/id first, then falls back to a `mail` filter (covers cases where the
 * imported email differs from the UPN).
 */
async function resolveUserAadId(
  token: string,
  email: string
): Promise<string | null> {
  const headers = { Authorization: `Bearer ${token}` };

  // 1) Direct lookup (works when email === userPrincipalName or is an id)
  const direct = await fetch(
    `${GRAPH_BASE}/users/${encodeURIComponent(email)}?$select=id`,
    { headers }
  );
  if (direct.ok) {
    const data = await direct.json();
    if (data?.id) return data.id as string;
  }

  // 2) Fallback: filter by mail
  const filtered = await fetch(
    `${GRAPH_BASE}/users?$filter=${encodeURIComponent(
      `mail eq '${email}'`
    )}&$select=id`,
    { headers: { ...headers, ConsistencyLevel: "eventual" } }
  );
  if (filtered.ok) {
    const data = await filtered.json();
    const id = data?.value?.[0]?.id;
    if (id) return id as string;
  }

  return null;
}

/**
 * Ensure the PulseSurvey app is installed in the user's personal scope.
 * Returns the teamsAppInstallation id. Idempotent: if already installed,
 * looks up and returns the existing installation id.
 */
async function ensureAppInstalled(
  token: string,
  userId: string,
  catalogAppId: string
): Promise<string> {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const findExisting = async (): Promise<string | null> => {
    const res = await fetch(
      `${GRAPH_BASE}/users/${userId}/teamwork/installedApps?$expand=teamsApp&$filter=${encodeURIComponent(
        `teamsApp/id eq '${catalogAppId}'`
      )}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.value?.[0]?.id as string) ?? null;
  };

  // Already installed?
  const existing = await findExisting();
  if (existing) return existing;

  // Install
  const install = await fetch(
    `${GRAPH_BASE}/users/${userId}/teamwork/installedApps`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        "teamsApp@odata.bind": `${GRAPH_BASE}/appCatalogs/teamsApps/${catalogAppId}`,
      }),
    }
  );

  // 409 = already installed (race or pre-existing) — re-query.
  if (install.status === 409) {
    const again = await findExisting();
    if (again) return again;
  }

  if (!install.ok && install.status !== 409) {
    const error = await install.text();
    throw new Error(`App install failed (${install.status}): ${error}`);
  }

  const afterInstall = await findExisting();
  if (!afterInstall) {
    throw new Error("Installation succeeded but installation id not found");
  }
  return afterInstall;
}

/** Fetch the 1:1 chat for an installed app to obtain the conversation id. */
async function getInstalledAppChatId(
  token: string,
  userId: string,
  installationId: string
): Promise<string> {
  const res = await fetch(
    `${GRAPH_BASE}/users/${userId}/teamwork/installedApps/${installationId}/chat`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Get chat failed (${res.status}): ${error}`);
  }
  const data = await res.json();
  if (!data?.id) throw new Error("Chat resource has no id");
  return data.id as string;
}

/**
 * Provision a conversation reference for a user by email: installs the app
 * silently if needed and returns the conversation (chat) id usable for
 * proactive messaging via the Bot Connector.
 *
 * Returns null if the user cannot be resolved or provisioning is not
 * configured; throws on unexpected Graph errors.
 */
export async function provisionConversation(
  email: string
): Promise<ProvisionedConversation | null> {
  if (!isGraphProvisioningConfigured()) return null;

  const catalogAppId = process.env.TEAMS_CATALOG_APP_ID!;
  const token = await getGraphToken();

  const aadId = await resolveUserAadId(token, email);
  if (!aadId) return null;

  const installationId = await ensureAppInstalled(token, aadId, catalogAppId);
  const conversationId = await getInstalledAppChatId(token, aadId, installationId);

  return { conversationId, aadId };
}
