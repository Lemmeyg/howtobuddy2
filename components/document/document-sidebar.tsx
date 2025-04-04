import { Document } from '@/types/document';
import { formatTime } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Bookmark, StickyNote } from 'lucide-react';

interface DocumentSidebarProps {
  document: Document;
  onChapterClick: (startTime: number) => void;
  onHighlightClick: (startTime: number) => void;
}

export function DocumentSidebar({
  document,
  onChapterClick,
  onHighlightClick,
}: DocumentSidebarProps) {
  return (
    <Tabs defaultValue="chapters" className="h-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="chapters">
          <BookOpen className="w-4 h-4 mr-2" />
          Chapters
        </TabsTrigger>
        <TabsTrigger value="highlights">
          <Bookmark className="w-4 h-4 mr-2" />
          Highlights
        </TabsTrigger>
        <TabsTrigger value="notes">
          <StickyNote className="w-4 h-4 mr-2" />
          Notes
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="h-[calc(100vh-3rem)]">
        <TabsContent value="chapters" className="mt-0">
          {document.metadata?.chapters?.map((chapter, index) => (
            <button
              key={index}
              onClick={() => onChapterClick(chapter.startTime)}
              className="w-full p-2 text-left hover:bg-gray-100"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{chapter.title}</span>
                <span className="text-sm text-gray-500">
                  {formatTime(chapter.startTime)}
                </span>
              </div>
            </button>
          ))}
        </TabsContent>

        <TabsContent value="highlights" className="mt-0">
          {document.metadata?.highlights?.map((highlight, index) => (
            <button
              key={index}
              onClick={() => onHighlightClick(highlight.startTime)}
              className="w-full p-2 text-left hover:bg-gray-100"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{highlight.text}</span>
                <span className="text-xs text-gray-500">
                  {formatTime(highlight.startTime)}
                </span>
              </div>
            </button>
          ))}
        </TabsContent>

        <TabsContent value="notes" className="mt-0">
          {document.metadata?.annotations
            ?.filter((annotation) => annotation.type === 'note')
            .map((note, index) => (
              <button
                key={index}
                onClick={() => onHighlightClick(note.startTime)}
                className="w-full p-2 text-left hover:bg-gray-100"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{note.content}</span>
                  <span className="text-xs text-gray-500">
                    {formatTime(note.startTime)}
                  </span>
                </div>
              </button>
            ))}
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
} 