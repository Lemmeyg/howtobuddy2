import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ProcessingStatusProps {
  status: "pending" | "processing" | "completed" | "error";
  progress?: number;
  errorMessage?: string;
  className?: string;
}

export function ProcessingStatus({
  status,
  progress = 0,
  errorMessage,
  className,
}: ProcessingStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "Waiting to start";
      case "processing":
        return "Processing video";
      case "completed":
        return "Processing complete";
      case "error":
        return "Processing failed";
      default:
        return "Unknown status";
    }
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{getStatusText()}</span>
            {status === "processing" && (
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            )}
          </div>
          {status === "processing" && (
            <Progress value={progress} className="mt-2" />
          )}
          {status === "error" && errorMessage && (
            <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
          )}
        </div>
      </div>
    </Card>
  );
} 