import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // Verify the requesting user is an admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!profile.tenant_id) {
    return NextResponse.json(
      { error: "Votre compte n'est rattaché à aucune organisation" },
      { status: 400 }
    );
  }

  const { email, password, full_name, role } = await request.json();

  if (!email || !password || !full_name || !role) {
    return NextResponse.json(
      { error: "Tous les champs sont requis" },
      { status: 400 }
    );
  }

  // Create user with admin client (bypasses RLS)
  const adminClient = createAdminClient();

  const { data: newUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // Rattacher le nouveau profil au tenant de l'admin appelant.
  // Le trigger handle_new_user crée le profil sans tenant_id, ce qui le rend
  // invisible dans la liste (filtrée par RLS sur tenant_id).
  const { error: tenantError } = await adminClient
    .from("profiles")
    .update({ tenant_id: profile.tenant_id })
    .eq("id", newUser.user.id);

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 400 });
  }

  // Inscrire le nouvel utilisateur dans tenant_members : c'est cette table
  // (et non profiles.tenant_id) que le middleware utilise pour le gating
  // d'accès. Sans cette ligne, l'utilisateur est renvoyé vers /signup?step=plan.
  const { error: membershipError } = await adminClient
    .from("tenant_members")
    .insert({
      tenant_id: profile.tenant_id,
      user_id: newUser.user.id,
      role: "member",
    });

  if (membershipError) {
    return NextResponse.json(
      { error: membershipError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ user: newUser }, { status: 201 });
}
