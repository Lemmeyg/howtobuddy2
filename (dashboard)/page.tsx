import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { VideoUploadForm } from "@/components/dashboard/video-upload-form";
import { DocumentsList } from "@/components/dashboard/documents-list";
import { DashboardSkeleton } from "@/components/dashboard/skeleton";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Upload a YouTube video to get started"
      />
      <div className="grid gap-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <VideoUploadForm />
        </Suspense>
        <Suspense fallback={<DashboardSkeleton />}>
          <DocumentsList />
        </Suspense>
      </div>
    </DashboardShell>
  );
} 