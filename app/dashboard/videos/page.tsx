import { VideoSubmissionForm } from "@/components/video/video-submission-form";
import { TranscriptionProgress } from "@/components/video/transcription-progress";
import { Card } from "@/components/ui/card";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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
          <VideoSubmissionForm
            onSuccess={(documentId) => {
              // The progress component will handle the rest
            }}
          />
        </div>

        {latestDocument && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Current Processing</h2>
            <TranscriptionProgress
              documentId={latestDocument.id}
              onComplete={() => {
                // Handle completion (e.g., redirect to document view)
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 