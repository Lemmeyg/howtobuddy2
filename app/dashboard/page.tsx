import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentList } from "@/components/dashboard/document-list";
import { createSupabaseClient } from "@/lib/supabase/server";
import { FileText, Clock, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

async function getStats() {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching documents:", error);
    return {
      totalDocuments: 0,
      processingDocuments: 0,
      errorDocuments: 0,
      recentDocuments: [],
    };
  }

  // Calculate stats
  const totalDocuments = documents.length;
  const processingDocuments = documents.filter(doc => doc.status === "processing").length;
  const errorDocuments = documents.filter(doc => doc.status === "error").length;

  return {
    totalDocuments,
    processingDocuments,
    errorDocuments,
    recentDocuments: documents,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your documents.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Processing
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processingDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Errors
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errorDocuments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recent Documents</h3>
        <Suspense fallback={<DocumentList documents={[]} isLoading />}>
          <DocumentList documents={stats.recentDocuments} />
        </Suspense>
      </div>
    </div>
  );
} 