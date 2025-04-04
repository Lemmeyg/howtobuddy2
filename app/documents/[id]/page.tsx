import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DocumentHeader } from "@/components/document/document-header";
import { DocumentContainer } from "@/components/document/document-container";

interface DocumentPageProps {
  params: {
    id: string;
  };
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: document, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single();

  if (error || !document) {
    redirect("/documents");
  }

  const handleExport = async (format: "text" | "markdown" | "json") => {
    "use server";
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/documents/${params.id}/export?format=${format}`,
      {
        headers: {
          Cookie: cookies().toString(),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export document");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${document.title}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <DocumentHeader document={document} onExport={handleExport} />
      <DocumentContainer document={document} />
    </div>
  );
} 