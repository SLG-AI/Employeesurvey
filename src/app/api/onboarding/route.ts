import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOnboardingSchema } from "@/lib/onboarding/schema";
import { generateSlug } from "@/lib/onboarding/slug";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { data: member, error: memberError } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: "no_tenant" }, { status: 403 });
  }

  const initialState = {
    lang: "fr" as const,
    checked: [] as number[],
    health: {} as Record<string, number>,
    rows: {} as Record<string, string[][]>,
  };

  const { data, error } = await supabase
    .from("onboardings")
    .insert({
      tenant_id: member.tenant_id,
      slug: generateSlug(),
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      employee_id: parsed.data.employee_id,
      job_title: parsed.data.job_title,
      start_date: parsed.data.start_date ?? null,
      state: initialState,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ onboarding: data }, { status: 201 });
}
