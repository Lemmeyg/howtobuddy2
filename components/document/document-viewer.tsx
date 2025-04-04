import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { EntityList } from "@/components/document/entity-list";
import { AnnotationToolbar } from "@/components/document/annotation-toolbar";
import { AnnotationNote } from "@/components/document/annotation-note";
import { Document } from "@/types/documents";
import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { formatDuration, formatTime } from '@/lib/utils';

interface DocumentViewerProps {
  document: Document;
  onNavigateToTime?: (time: number) => void;
  onAddAnnotation: (type: 'highlight' | 'note', startTime: number, endTime: number, content?: string) => void;
  onDeleteAnnotation: (id: string) => void;
}

export function DocumentViewer({
  document,
  onNavigateToTime,
  onAddAnnotation,
  onDeleteAnnotation,
}: DocumentViewerProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const handleAddAnnotation = (type: 'highlight' | 'note') => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const startTime = parseInt(range.startContainer.parentElement?.getAttribute('data-start-time') || '0');
    const endTime = parseInt(range.endContainer.parentElement?.getAttribute('data-end-time') || '0');

    if (type === 'highlight') {
      onAddAnnotation('highlight', startTime, endTime);
    } else {
      setShowNote(true);
      setSelectedAnnotation(`${startTime}-${endTime}`);
    }
  };

  const handleSaveNote = (content: string) => {
    if (!selectedAnnotation) return;

    const [startTime, endTime] = selectedAnnotation.split('-').map(Number);
    onAddAnnotation('note', startTime, endTime, content);
    setShowNote(false);
    setSelectedAnnotation(null);
  };

  const handleDeleteAnnotation = () => {
    if (!selectedAnnotation) return;

    onDeleteAnnotation(selectedAnnotation);
    setSelectedAnnotation(null);
    setShowNote(false);
  };

  const scrollToTime = (time: number) => {
    if (!contentRef.current) return;

    // Find the paragraph that contains the timestamp
    const paragraphs = contentRef.current.querySelectorAll("p");
    let targetParagraph: HTMLElement | null = null;

    for (const paragraph of paragraphs) {
      const text = paragraph.textContent || "";
      if (text.includes(formatTime(time))) {
        targetParagraph = paragraph as HTMLElement;
        break;
      }
    }

    if (targetParagraph) {
      targetParagraph.scrollIntoView({ behavior: "smooth", block: "center" });
      targetParagraph.classList.add("bg-yellow-100");
      setTimeout(() => {
        targetParagraph?.classList.remove("bg-yellow-100");
      }, 2000);
    }
  };

  useEffect(() => {
    if (onNavigateToTime) {
      scrollToTime(onNavigateToTime);
    }
  }, [onNavigateToTime]);

  if (document.status === "pending") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Processing Document</p>
          <p className="text-sm text-muted-foreground">
            This may take a few minutes...
          </p>
        </div>
      </div>
    );
  }

  if (document.status === "error") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-medium text-red-500">Processing Failed</p>
          <p className="text-sm text-muted-foreground">
            Please try again later or contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold">{document.title}</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {document.word_count?.toLocaleString()} words
              </Badge>
              <Badge variant="outline">
                {formatDuration(document.audio_duration)}
              </Badge>
              <Badge variant="outline">
                {Math.round(document.confidence * 100)}% confidence
              </Badge>
            </div>
          </div>

          <AnnotationToolbar
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            hasSelectedAnnotation={!!selectedAnnotation}
          />

          <Card className="p-6">
            <div className="prose max-w-none" ref={contentRef}>
              {document.content}
            </div>
          </Card>

          {document.key_entities && document.key_entities.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Key Entities</h3>
              <EntityList entities={document.key_entities} />
            </div>
          )}
        </div>
      </ScrollArea>

      {showNote && (
        <div className="absolute bottom-6 right-6">
          <AnnotationNote
            content={noteContent}
            onSave={handleSaveNote}
            onDelete={handleDeleteAnnotation}
            onClose={() => setShowNote(false)}
          />
        </div>
      )}
    </div>
  );
} 