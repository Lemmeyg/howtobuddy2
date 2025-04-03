import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TemplateList } from "@/components/templates/template-list";

export const metadata: Metadata = {
  title: "Templates - HowToBuddy",
  description: "Manage your document templates",
};

export default async function TemplatesPage() {
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
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground">
          Create and manage your document templates.
        </p>
      </div>

      <TemplateList userId={session.user.id} />
    </div>
  );
} 