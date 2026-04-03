import { createAdminClient } from "@/lib/supabase/admin";

// Bot credentials (your centralized bot, shared across all client tenants)
const BOT_APP_ID = process.env.TEAMS_BOT_APP_ID!;
const BOT_APP_SECRET = process.env.TEAMS_BOT_APP_SECRET!;

export function isBotConfigured(): boolean {
  return !!(process.env.TEAMS_BOT_APP_ID && process.env.TEAMS_BOT_APP_SECRET);
}

/**
 * Get an access token for the bot to send proactive messages.
 * Uses the Bot Framework token endpoint (not tenant-specific).
 */
async function getBotAccessToken(): Promise<string> {
  const tenantId = process.env.AZURE_TENANT_ID || "botframework.com";
  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: BOT_APP_ID,
        client_secret: BOT_APP_SECRET,
        scope: "https://api.botframework.com/.default",
      }).toString(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bot auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Store or update a conversation reference when the bot is installed for a user.
 */
/**
 * Resolve a user's email from Azure AD via Microsoft Graph.
 * Requires AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and the user's tenant ID.
 */
async function resolveEmailFromGraph(
  userAadId: string,
  tenantId: string
): Promise<string> {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !tenantId) return "";

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }).toString(),
    }
  );

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    console.error("[Teams Bot] Graph token error:", tokenResponse.status, err);
    return "";
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  const userResponse = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userAadId}?$select=mail,userPrincipalName`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!userResponse.ok) {
    const err = await userResponse.text();
    console.error("[Teams Bot] Graph user lookup error:", userResponse.status, err);
    return "";
  }

  const userData = await userResponse.json();
  console.log("[Teams Bot] Resolved email for", userAadId, ":", userData.mail || userData.userPrincipalName);
  return userData.mail || userData.userPrincipalName || "";
}

export async function saveInstallation(activity: BotActivity) {
  const admin = createAdminClient();

  let userEmail =
    activity.from?.email ||
    activity.members?.[0]?.email ||
    activity.from?.userPrincipalName ||
    activity.members?.[0]?.userPrincipalName ||
    "";

  const userAadId =
    activity.from?.aadObjectId ||
    activity.members?.[0]?.aadObjectId ||
    "";

  if (!userAadId) return;

  const azureTenantId = activity.channelData?.tenant?.id || activity.conversation?.tenantId || "";

  // If email is missing, resolve it from Microsoft Graph
  if (!userEmail && userAadId && azureTenantId) {
    try {
      userEmail = await resolveEmailFromGraph(userAadId, azureTenantId);
    } catch {
      console.error("[Teams Bot] Failed to resolve email for", userAadId);
    }
  }

  await admin.from("teams_bot_installations").upsert(
    {
      azure_tenant_id: azureTenantId,
      user_email: userEmail.toLowerCase(),
      user_aad_id: userAadId,
      conversation_id: activity.conversation?.id || "",
      service_url: activity.serviceUrl || "",
      bot_id: activity.recipient?.id || BOT_APP_ID,
      installed_at: new Date().toISOString(),
    },
    { onConflict: "azure_tenant_id,user_aad_id" }
  );
}

/**
 * Remove installation when bot is uninstalled.
 */
export async function removeInstallation(activity: BotActivity) {
  const admin = createAdminClient();
  const userAadId =
    activity.from?.aadObjectId ||
    activity.membersRemoved?.[0]?.aadObjectId ||
    "";
  const azureTenantId = activity.channelData?.tenant?.id || activity.conversation?.tenantId || "";

  if (userAadId && azureTenantId) {
    await admin
      .from("teams_bot_installations")
      .delete()
      .eq("azure_tenant_id", azureTenantId)
      .eq("user_aad_id", userAadId);
  }
}

/**
 * Send a proactive message to a user via their stored conversation reference.
 */
async function sendProactiveMessage(
  serviceUrl: string,
  conversationId: string,
  message: string
): Promise<void> {
  const accessToken = await getBotAccessToken();

  // Parse the markdown message to extract link
  const linkMatch = message.match(/\[([^\]]+)\]\(([^)]+)\)/);
  const linkText = linkMatch ? linkMatch[1] : "Ouvrir";
  const linkUrl = linkMatch ? linkMatch[2] : "";

  // Remove the markdown link and separator from the text body
  const bodyText = message
    .replace(/👉\s*\[([^\]]+)\]\([^)]+\)\n*/g, "")
    .replace(/---\n?/g, "")
    .trim();

  const url = `${serviceUrl.replace(/\/$/, "")}/v3/conversations/${encodeURIComponent(conversationId)}/activities`;

  const heroCard = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.hero",
        content: {
          text: bodyText,
          buttons: linkUrl
            ? [
                {
                  type: "openUrl",
                  title: `👉 ${linkText}`,
                  value: linkUrl,
                },
              ]
            : [],
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(heroCard),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send message: ${error}`);
  }
}

export interface TeamsBotRecipient {
  email: string;
  employeeName: string;
  surveyLink: string;
}

export interface SendBotResult {
  sent: number;
  failed: number;
  notInstalled: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Send proactive Teams messages to a list of recipients.
 * Looks up their conversation references in the database.
 */
export async function sendBotMessages(
  recipients: TeamsBotRecipient[],
  surveyTitle: string,
  type: "invitation" | "reminder"
): Promise<SendBotResult> {
  const result: SendBotResult = {
    sent: 0,
    failed: 0,
    notInstalled: 0,
    errors: [],
  };

  if (recipients.length === 0 || !isBotConfigured()) return result;

  const admin = createAdminClient();

  // Fetch all installations for the recipient emails
  const emails = recipients.map((r) => r.email.toLowerCase());
  const { data: installations } = await admin
    .from("teams_bot_installations")
    .select("user_email, conversation_id, service_url")
    .in("user_email", emails);

  const installMap = new Map<string, { conversation_id: string; service_url: string }>();
  if (installations) {
    for (const inst of installations) {
      installMap.set(inst.user_email.toLowerCase(), inst);
    }
  }

  // Import template generator
  const { generateTeamsMessage } = await import("./templates");

  for (const recipient of recipients) {
    const installation = installMap.get(recipient.email.toLowerCase());

    if (!installation) {
      result.notInstalled++;
      result.errors.push({
        email: recipient.email,
        error: "Bot non installé pour cet utilisateur",
      });
      continue;
    }

    try {
      const message = generateTeamsMessage(type, {
        employeeName: recipient.employeeName,
        surveyTitle,
        surveyLink: recipient.surveyLink,
      });

      await sendProactiveMessage(
        installation.service_url,
        installation.conversation_id,
        message
      );
      result.sent++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        email: recipient.email,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }

    // Small delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return result;
}

// Types for Bot Framework activities
export interface BotActivity {
  type: string;
  id?: string;
  timestamp?: string;
  serviceUrl?: string;
  channelId?: string;
  from?: {
    id?: string;
    name?: string;
    email?: string;
    userPrincipalName?: string;
    aadObjectId?: string;
  };
  recipient?: {
    id?: string;
    name?: string;
  };
  conversation?: {
    id?: string;
    tenantId?: string;
    conversationType?: string;
  };
  channelData?: {
    tenant?: { id?: string };
  };
  members?: Array<{
    id?: string;
    name?: string;
    email?: string;
    userPrincipalName?: string;
    aadObjectId?: string;
  }>;
  membersRemoved?: Array<{
    id?: string;
    aadObjectId?: string;
  }>;
  text?: string;
  action?: string;
}
