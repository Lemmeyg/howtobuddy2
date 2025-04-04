"use client";

import { Document } from "@/types/documents";
import { DocumentSidebar } from "./document-sidebar";
import { DocumentViewer } from "./document-viewer";
import { useState } from "react";

interface DocumentContainerProps {
  document: Document;
}

export function DocumentContainer({ document }: DocumentContainerProps) {
  const [navigateToTime, setNavigateToTime] = useState<number | null>(null);

  const handleChapterClick = (startTime: number) => {
    setNavigateToTime(startTime);
  };

  const handleHighlightClick = (startTime: number) => {
    setNavigateToTime(startTime);
  };

  const handleAddAnnotation = async (
    type: 'highlight' | 'note',
    startTime: number,
    endTime: number,
    content?: string
  ) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          startTime,
          endTime,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add annotation');
      }

      // Refresh document to get updated annotations
      window.location.reload();
    } catch (error) {
      console.error('Error adding annotation:', error);
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/annotations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete annotation');
      }

      // Refresh document to get updated annotations
      window.location.reload();
    } catch (error) {
      console.error('Error deleting annotation:', error);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-64 border-r">
        <DocumentSidebar
          document={document}
          onChapterClick={handleChapterClick}
          onHighlightClick={handleHighlightClick}
        />
      </div>
      <div className="flex-1">
        <DocumentViewer
          document={document}
          onNavigateToTime={setNavigateToTime}
          onAddAnnotation={handleAddAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
        />
      </div>
    </div>
  );
} 