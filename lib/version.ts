import { createSupabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  created_by: string;
}

export async function getDocumentVersions(
  documentId: string,
  userId: string
): Promise<DocumentVersion[]> {
  const supabase = createSupabaseServer();

  try {
    const { data: versions, error } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false });

    if (error) {
      throw error;
    }

    return versions || [];
  } catch (error) {
    logger.error("Error fetching document versions:", error);
    return [];
  }
}

export async function restoreDocumentVersion(
  documentId: string,
  versionId: string,
  userId: string
): Promise<boolean> {
  const supabase = createSupabaseServer();

  try {
    // Get version content
    const { data: version, error: versionError } = await supabase
      .from("document_versions")
      .select("*")
      .eq("id", versionId)
      .eq("document_id", documentId)
      .single();

    if (versionError || !version) {
      throw new Error("Version not found");
    }

    // Update document with version content
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        content: version.content,
        metadata: version.metadata,
      })
      .eq("id", documentId)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error) {
    logger.error("Error restoring document version:", error);
    return false;
  }
}

export async function compareVersions(
  version1: DocumentVersion,
  version2: DocumentVersion
): Promise<{
  added: string[];
  removed: string[];
  changed: string[];
}> {
  const content1 = version1.content.split("\n");
  const content2 = version2.content.split("\n");

  const added = content2.filter((line) => !content1.includes(line));
  const removed = content1.filter((line) => !content2.includes(line));
  const changed = content1.filter(
    (line, index) =>
      content2[index] && line !== content2[index] && !added.includes(line)
  );

  return {
    added,
    removed,
    changed,
  };
} 