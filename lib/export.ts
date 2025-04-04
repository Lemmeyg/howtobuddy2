import { Document } from "@/types/documents";
import { formatDuration, formatTime } from '@/lib/utils';

export function exportAsText(document: Document): string {
  const lines: string[] = [];

  // Document metadata
  lines.push(`Title: ${document.title}`);
  lines.push(`Created: ${new Date(document.created_at).toLocaleDateString()}`);
  if (document.metadata?.audio_duration) {
    lines.push(`Duration: ${formatDuration(document.metadata.audio_duration)}`);
  }
  if (document.metadata?.word_count) {
    lines.push(`Word Count: ${document.metadata.word_count}`);
  }
  if (document.metadata?.confidence) {
    lines.push(`Confidence: ${Math.round(document.metadata.confidence * 100)}%`);
  }
  lines.push('');

  // Chapters
  if (document.metadata?.chapters?.length) {
    lines.push('Chapters:');
    document.metadata.chapters.forEach((chapter) => {
      lines.push(`- ${chapter.headline} (${formatTime(chapter.start)})`);
    });
    lines.push('');
  }

  // Content
  lines.push('Content:');
  lines.push(document.content || '');
  lines.push('');

  // Highlights
  if (document.metadata?.highlights?.length) {
    lines.push('Highlights:');
    document.metadata.highlights.forEach((highlight) => {
      lines.push(`- ${highlight.text} (${formatTime(highlight.timestamp)})`);
    });
    lines.push('');
  }

  // Notes
  if (document.metadata?.annotations?.length) {
    lines.push('Notes:');
    document.metadata.annotations
      .filter((annotation) => annotation.type === 'note')
      .forEach((note) => {
        lines.push(`- ${note.content} (${formatTime(note.startTime)})`);
      });
    lines.push('');
  }

  // Entities
  if (document.metadata?.entities?.length) {
    lines.push('Key Entities:');
    document.metadata.entities.forEach((entity) => {
      lines.push(`- ${entity.text} (${entity.entity_type})`);
    });
  }

  return lines.join('\n');
}

export function exportAsMarkdown(document: Document): string {
  const lines: string[] = [];

  // Document metadata
  lines.push(`# ${document.title}`);
  lines.push('');
  lines.push('## Metadata');
  lines.push(`- Created: ${new Date(document.created_at).toLocaleDateString()}`);
  if (document.metadata?.audio_duration) {
    lines.push(`- Duration: ${formatDuration(document.metadata.audio_duration)}`);
  }
  if (document.metadata?.word_count) {
    lines.push(`- Word Count: ${document.metadata.word_count}`);
  }
  if (document.metadata?.confidence) {
    lines.push(`- Confidence: ${Math.round(document.metadata.confidence * 100)}%`);
  }
  lines.push('');

  // Chapters
  if (document.metadata?.chapters?.length) {
    lines.push('## Chapters');
    document.metadata.chapters.forEach((chapter) => {
      lines.push(`### ${chapter.headline}`);
      lines.push(`Timestamp: ${formatTime(chapter.start)}`);
      lines.push('');
    });
  }

  // Content
  lines.push('## Content');
  lines.push(document.content || '');
  lines.push('');

  // Highlights
  if (document.metadata?.highlights?.length) {
    lines.push('## Highlights');
    document.metadata.highlights.forEach((highlight) => {
      lines.push(`- ${highlight.text}`);
      lines.push(`  - Timestamp: ${formatTime(highlight.timestamp)}`);
    });
    lines.push('');
  }

  // Notes
  if (document.metadata?.annotations?.length) {
    lines.push('## Notes');
    document.metadata.annotations
      .filter((annotation) => annotation.type === 'note')
      .forEach((note) => {
        lines.push(`- ${note.content}`);
        lines.push(`  - Timestamp: ${formatTime(note.startTime)}`);
      });
    lines.push('');
  }

  // Entities
  if (document.metadata?.entities?.length) {
    lines.push('## Key Entities');
    document.metadata.entities.forEach((entity) => {
      lines.push(`- ${entity.text} (${entity.entity_type})`);
    });
  }

  return lines.join('\n');
}

export function exportAsJSON(document: Document): string {
  return JSON.stringify(
    {
      title: document.title,
      created_at: document.created_at,
      metadata: {
        ...document.metadata,
        audio_duration: document.metadata?.audio_duration,
        word_count: document.metadata?.word_count,
        confidence: document.metadata?.confidence,
        chapters: document.metadata?.chapters?.map((chapter) => ({
          headline: chapter.headline,
          start: chapter.start,
          end: chapter.end,
        })),
        highlights: document.metadata?.highlights?.map((highlight) => ({
          text: highlight.text,
          timestamp: highlight.timestamp,
          end_timestamp: highlight.end_timestamp,
        })),
        annotations: document.metadata?.annotations?.map((annotation) => ({
          type: annotation.type,
          start_timestamp: annotation.start_timestamp,
          end_timestamp: annotation.end_timestamp,
          content: annotation.content,
          created_at: annotation.created_at,
        })),
        entities: document.metadata?.entities?.map((entity) => ({
          text: entity.text,
          entity_type: entity.entity_type,
          start_timestamp: entity.start_timestamp,
          end_timestamp: entity.end_timestamp,
        })),
      },
      content: document.content,
    },
    null,
    2
  );
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "Unknown duration";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function groupEntities(entities: any[]) {
  return entities.reduce((acc, entity) => {
    const type = entity.entity_type.toLowerCase();
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(entity);
    return acc;
  }, {} as Record<string, any[]>);
} 