import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTeamsConfigured, getTeamsMode } from "@/lib/teams/graph";
import { isBotConfigured } from "@/lib/teams/bot";

export async function GET() {
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

  if (!profile || !["admin", "hr_management"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: installations, count } = await admin
    .from("teams_bot_installations")
    .select("user_email, conversation_id, service_url, installed_at", { count: "exact" })
    .limit(50);

  return NextResponse.json({
    teamsConfigured: isTeamsConfigured(),
    mode: getTeamsMode(),
    botConfigured: isBotConfigured(),
    envCheck: {
      TEAMS_BOT_APP_ID: !!process.env.TEAMS_BOT_APP_ID,
      TEAMS_BOT_APP_SECRET: !!process.env.TEAMS_BOT_APP_SECRET,
      AZURE_TENANT_ID: !!process.env.AZURE_TENANT_ID,
      AZURE_CLIENT_ID: !!process.env.AZURE_CLIENT_ID,
      AZURE_CLIENT_SECRET: !!process.env.AZURE_CLIENT_SECRET,
    },
    installations: {
      count: count || 0,
      data: (installations || []).map((i) => ({
        email: i.user_email,
        hasConversationId: !!i.conversation_id,
        hasServiceUrl: !!i.service_url,
        installedAt: i.installed_at,
      })),
    },
  });
}
