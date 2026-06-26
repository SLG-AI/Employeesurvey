import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contentOrDefault } from "@/lib/onboarding/content";
import { QuestionnaireEditor } from "./_components/questionnaire-editor";

export default async function EditOnboardingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  // RLS scopes this to the caller's tenant; missing / cross-tenant → not found.
  const { data } = await supabase
    .from("onboardings")
    .select("id, first_name, last_name, job_title, content")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <QuestionnaireEditor
      id={data.id}
      fullName={`${data.first_name} ${data.last_name}`.trim()}
      jobTitle={data.job_title}
      initialContent={contentOrDefault(data.content)}
    />
  );
}
