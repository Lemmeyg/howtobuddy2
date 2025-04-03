import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TemplateApplier } from "@/components/templates/template-applier";
import { redirect } from "next/navigation";

interface TemplateApplyPageProps {
  params: {
    id: string;
  };
  searchParams: {
    documentId?: string;
  };
}

export async function generateMetadata({
  params,
}: TemplateApplyPageProps): Promise<Metadata> {
  const supabase = createClient();

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      title: "Apply Template - HowToBuddy",
      description: "Apply a template to your document",
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
    title: `Apply ${template?.name || "Template"} - HowToBuddy`,
    description: "Apply a template to your document",
  };
}

export default async function TemplateApplyPage({
  params,
  searchParams,
}: TemplateApplyPageProps) {
  const supabase = createClient();

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Validate document ID
  if (!searchParams.documentId) {
    redirect("/documents");
  }

  // Validate document ownership
  const { data: document } = await supabase
    .from("documents")
    .select("id")
    .eq("id", searchParams.documentId)
    .eq("userId", session.user.id)
    .single();

  if (!document) {
    redirect("/documents");
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Apply Template</h1>
        <p className="text-muted-foreground">
          Apply a template to your document.
        </p>
      </div>

      <TemplateApplier
        templateId={params.id}
        documentId={searchParams.documentId}
        userId={session.user.id}
        onApply={(content) => {
          // Handle template application
          console.log("Template applied:", content);
        }}
      />
    </div>
  );
} 