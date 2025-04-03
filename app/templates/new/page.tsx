import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/templates/template-editor";

export const metadata: Metadata = {
  title: "New Template - HowToBuddy",
  description: "Create a new document template",
};

export default async function NewTemplatePage() {
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
        <h1 className="text-3xl font-bold">New Template</h1>
        <p className="text-muted-foreground">
          Create a new document template.
        </p>
      </div>

      <TemplateEditor userId={session.user.id} />
    </div>
  );
} 