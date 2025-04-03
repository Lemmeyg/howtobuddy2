import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ResultDisplayProps {
  type: "summary" | "keyPoints" | "questions" | "sentiment" | "topics";
  result: any;
  className?: string;
}

export function ResultDisplay({ type, result, className }: ResultDisplayProps) {
  if (!result) return null;

  const renderContent = () => {
    switch (type) {
      case "summary":
        return (
          <div className="prose prose-sm max-w-none">
            {result.split("\n").map((paragraph: string, index: number) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        );

      case "keyPoints":
        return (
          <ul className="list-disc pl-6 space-y-2">
            {result.map((point: string, index: number) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        );

      case "questions":
        return (
          <ol className="list-decimal pl-6 space-y-2">
            {result.map((question: string, index: number) => (
              <li key={index}>{question}</li>
            ))}
          </ol>
        );

      case "sentiment":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  result.sentiment === "positive"
                    ? "success"
                    : result.sentiment === "negative"
                    ? "destructive"
                    : "secondary"
                }
              >
                {result.sentiment}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Key Phrases:</h4>
              <div className="flex flex-wrap gap-2">
                {result.keyPhrases.map((phrase: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {phrase}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case "topics":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Main Topics:</h4>
              <div className="flex flex-wrap gap-2">
                {result.mainTopics.map((topic: string, index: number) => (
                  <Badge key={index} variant="default">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Subtopics:</h4>
              {Object.entries(result.subtopics).map(([topic, subtopics]) => (
                <div key={topic} className="space-y-1">
                  <h5 className="text-sm font-medium">{topic}:</h5>
                  <div className="flex flex-wrap gap-2">
                    {(subtopics as string[]).map((subtopic, index) => (
                      <Badge key={index} variant="outline">
                        {subtopic}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </span>
              <Progress value={result.confidence * 100} className="w-24" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg capitalize">
          {type.replace(/([A-Z])/g, " $1").trim()}
        </CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
} 