import { NextRequest, NextResponse } from "next/server";
import {
  saveInstallation,
  removeInstallation,
  type BotActivity,
} from "@/lib/teams/bot";

/**
 * Bot Framework webhook endpoint.
 * Azure Bot Service sends activities here when users interact with the bot.
 *
 * Key activities handled:
 * - installationUpdate: bot installed/uninstalled for a user
 * - conversationUpdate: members added/removed (also triggered on install)
 * - message: user sends a message to the bot
 */
export async function POST(request: NextRequest) {
  // Bot Framework sends a Bearer token in the Authorization header.
  // In production, you should validate this token using the Bot Framework SDK
  // or by verifying the JWT against Microsoft's OpenID metadata.
  // For now, we check that the request has an authorization header.
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let activity: BotActivity;
  try {
    activity = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  console.log("[Teams Bot Webhook] Activity received:", {
    type: activity.type,
    action: activity.action,
    fromEmail: activity.from?.email || activity.from?.userPrincipalName,
    fromAadId: activity.from?.aadObjectId,
    conversationId: activity.conversation?.id,
    serviceUrl: activity.serviceUrl,
    membersCount: activity.members?.length,
  });

  try {
    switch (activity.type) {
      case "installationUpdate": {
        if (activity.action === "add") {
          await saveInstallation(activity);
        } else if (activity.action === "remove") {
          await removeInstallation(activity);
        }
        break;
      }

      case "conversationUpdate": {
        // Members added = bot installed for users
        if (activity.members && activity.members.length > 0) {
          await saveInstallation(activity);
        }
        // Members removed = bot uninstalled
        if (activity.membersRemoved && activity.membersRemoved.length > 0) {
          await removeInstallation(activity);
        }
        break;
      }

      case "message": {
        // User sent a message to the bot — reply with help text
        if (activity.serviceUrl && activity.conversation?.id) {
          const serviceUrl = activity.serviceUrl.replace(/\/$/, "");
          const conversationId = activity.conversation.id;

          // Also save/update the installation reference
          await saveInstallation(activity);

          // Send a simple reply
          const replyUrl = `${serviceUrl}/v3/conversations/${encodeURIComponent(conversationId)}/activities`;

          // We need a token to reply — import the function
          const { default: getBotToken } = await import("@/lib/teams/bot-token");
          const token = await getBotToken();

          await fetch(replyUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "message",
              text: "Bonjour ! Je suis le bot PulseSurvey. Je vous enverrai des notifications lorsqu'un nouveau sondage sera disponible. Vous n'avez rien à faire de plus.",
            }),
          });
        }
        break;
      }
    }
  } catch (error) {
    console.error("[Teams Bot Webhook] Error processing activity:", error);
  }

  // Bot Framework expects a 200/201 response
  return NextResponse.json({ status: "ok" });
}
