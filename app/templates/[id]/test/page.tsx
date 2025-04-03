import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TemplateTester } from "@/components/templates/template-tester";

interface TemplateTestPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: TemplateTestPageProps): Promise<Metadata> {
  const supabase = createClient();

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      title: "Test Template - HowToBuddy",
      description: "Test your document template",
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
    title: `Test ${template?.name || "Template"} - HowToBuddy`,
    description: "Test your document template",
  };
}

export default async function TemplateTestPage({
  params,
}: TemplateTestPageProps) {
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
        <h1 className="text-3xl font-bold">Test Template</h1>
        <p className="text-muted-foreground">
          Test your document template with different variables.
        </p>
      </div>

      <TemplateTester templateId={params.id} userId={session.user.id} />
    </div>
  );
} 