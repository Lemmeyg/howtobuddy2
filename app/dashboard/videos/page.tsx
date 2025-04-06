import { VideoSubmissionForm } from "@/components/video/video-submission-form";
import { TranscriptionProgress } from "@/components/video/transcription-progress";
import { Card } from "@/components/ui/card";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function VideosPage() {
  const supabase = createServerComponentClient({ cookies });

  // Get the latest processing document
  const { data: latestDocument } = await supabase
    .from("documents")
    .select("*")
    .eq("status", "processing")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get the latest completed documents
  const { data: recentDocuments } = await supabase
    .from("documents")
    .select("*")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Video Processing</h1>
        <p className="text-muted-foreground mt-2">
          Submit a video URL to start the transcription process.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Submit New Video</h2>
          <VideoSubmissionForm />
        </div>

        {latestDocument && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Current Processing</h2>
            <TranscriptionProgress
              documentId={latestDocument.id}
              onComplete={() => {
                // Refresh the page when processing completes
                redirect("/dashboard/videos");
              }}
            />
          </div>
        )}
      </div>

      {recentDocuments && recentDocuments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
          <div className="grid gap-4">
            {recentDocuments.map((document) => (
              <Card key={document.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{document.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(document.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <a
                    href={`/documents/${document.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Document
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 