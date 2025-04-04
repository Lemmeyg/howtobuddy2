import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentList } from "@/components/dashboard/document-list";
import { createSupabaseServer } from "@/lib/supabase/server";
import { FileText, Clock, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import DashboardError from "@/components/dashboard/error-boundary";

async function getStats() {
  console.log('📊 Dashboard: Starting getStats');
  
  try {
    // Check if we have a session cookie first
    const cookieStore = cookies();
    const hasSessionCookie = cookieStore.has('sb-access-token');
    console.log('🍪 Dashboard: Session cookie present:', hasSessionCookie);

    const supabase = createSupabaseServer();
    console.log('🔐 Dashboard: Checking session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Dashboard: Session error:', sessionError);
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    if (!session) {
      console.log('⚠️ Dashboard: No session found, redirecting to login');
      redirect("/login");
    }

    console.log('✅ Dashboard: Session found for user:', session.user.id);

    try {
      const { data: documents, error: documentsError } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (documentsError) {
        console.error("❌ Dashboard: Error fetching documents:", documentsError);
        throw new Error(`Failed to fetch documents: ${documentsError.message}`);
      }

      console.log('📄 Dashboard: Successfully fetched documents');

      // Calculate stats
      const totalDocuments = documents?.length ?? 0;
      const processingDocuments = documents?.filter(doc => doc.status === "processing").length ?? 0;
      const errorDocuments = documents?.filter(doc => doc.status === "error").length ?? 0;

      return {
        totalDocuments,
        processingDocuments,
        errorDocuments,
        recentDocuments: documents ?? [],
      };
    } catch (error) {
      console.error('❌ Dashboard: Document fetch error:', error);
      // Return empty stats instead of throwing
      return {
        totalDocuments: 0,
        processingDocuments: 0,
        errorDocuments: 0,
        recentDocuments: [],
      };
    }
  } catch (error) {
    console.error('❌ Dashboard: Critical error:', error);
    throw error;
  }
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

// Add error boundary
export const error = DashboardError; 