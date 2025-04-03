import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DocumentDetail } from "@/components/dashboard/document-detail";
import { createClient } from "@/lib/supabase/server";
import { logInfo } from "@/lib/logger";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export const dynamic = "force-dynamic";

async function getDocument(id: string) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const { data: document, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (error) {
    logInfo("Error fetching document", { error, documentId: id });
    if (error.code === "PGRST116") {
      notFound();
    }
    throw error;
  }

  return document;
}

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = paramsSchema.parse(params);
  const document = await getDocument(id);

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<DocumentDetail document={document} isLoading />}>
        <DocumentDetail document={document} />
      </Suspense>
    </div>
  );
} 