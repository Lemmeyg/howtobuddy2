import { Suspense } from "react";
import { DocumentList } from "@/components/dashboard/document-list";
import { createClient } from "@/lib/supabase/server";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function getDocuments() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logInfo("Error fetching documents", { error });
    throw error;
  }

  return documents;
}

export default async function DocumentsPage() {
  const documents = await getDocuments();

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">My Documents</h1>
      <Suspense fallback={<DocumentList documents={[]} isLoading />}>
        <DocumentList documents={documents} />
      </Suspense>
    </div>
  );
} 