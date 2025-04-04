import { createSupabaseClient } from "@/lib/supabase/server";
import { DocumentEditor } from "@/components/document/editor";
import { DocumentExport } from "@/components/document/document-export";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface DocumentPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: "Document Details",
  description: "View and edit your document",
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const supabase = createSupabaseClient();

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    notFound();
  }

  // Get the document
  const { data: document, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single();

  if (error || !document) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{document.title}</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date(document.updated_at).toLocaleDateString()}
          </p>
        </div>
        <DocumentExport document={document} />
      </div>

      <DocumentEditor 
        content={document.content} 
      />
    </div>
  );
} 