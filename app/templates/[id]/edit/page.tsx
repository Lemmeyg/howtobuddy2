import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/templates/template-editor";

interface TemplateEditPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: TemplateEditPageProps): Promise<Metadata> {
  const supabase = createClient();

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      title: "Edit Template - HowToBuddy",
      description: "Edit your document template",
    };
  }

  // Get template
  const { data: template } = await supabase
    .from("templates")
    .select("name")
    .eq("id", params.id)
    .eq("userId", session.user.id)
    .single();

  return {
    title: `Edit ${template?.name || "Template"} - HowToBuddy`,
    description: "Edit your document template",
  };
}

export default async function TemplateEditPage({
  params,
}: TemplateEditPageProps) {
  const supabase = createClient();

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Template</h1>
        <p className="text-muted-foreground">
          Edit your document template.
        </p>
      </div>

      <TemplateEditor templateId={params.id} userId={session.user.id} />
    </div>
  );
} 