import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SurveyFilters } from "@/lib/types";
import { getFilteredTokens } from "@/lib/utils/token-filtering";

export async function POST(request: Request) {
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

  const body = await request.json();
  const { filters } = body as { filters: SurveyFilters };

  const admin = createAdminClient();

  try {
    const tokens = await getFilteredTokens(admin, filters);

    // Fetch org names for display
    const orgIds = new Set<string>();
    for (const t of tokens) {
      if (t.societe_id) orgIds.add(t.societe_id);
      if (t.direction_id) orgIds.add(t.direction_id);
      if (t.department_id) orgIds.add(t.department_id);
      if (t.service_id) orgIds.add(t.service_id);
    }

    const orgMap = new Map<string, string>();
    if (orgIds.size > 0) {
      const { data: orgs } = await admin
        .from("organizations")
        .select("id, name")
        .in("id", Array.from(orgIds));
      if (orgs) {
        for (const o of orgs) orgMap.set(o.id, o.name);
      }
    }

    const employees = tokens.map((t) => ({
      id: t.id,
      employee_name: t.employee_name,
      email: t.email,
      fonction: t.fonction,
      societe_name: t.societe_id ? orgMap.get(t.societe_id) || null : null,
      direction_name: t.direction_id ? orgMap.get(t.direction_id) || null : null,
      department_name: t.department_id ? orgMap.get(t.department_id) || null : null,
      service_name: t.service_id ? orgMap.get(t.service_id) || null : null,
      lieu_travail: t.lieu_travail,
    }));

    return NextResponse.json({ employees });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
