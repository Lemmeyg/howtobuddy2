export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface Annotation {
  id: string;
  type: 'highlight' | 'note';
  startTime: number;
  endTime: number;
  content?: string;
  createdAt: string;
}

export interface DocumentMetadata {
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  outputType?: 'tutorial' | 'guide' | 'reference';
  duration?: number;
  wordCount?: number;
  confidence?: number;
  chapters?: Array<{
    title: string;
    startTime: number;
    endTime: number;
  }>;
  highlights?: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;
  entities?: Array<{
    text: string;
    type: string;
    startTime: number;
    endTime: number;
  }>;
  annotations?: Annotation[];
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  videoUrl: string;
  content: string;
  status: DocumentStatus;
  errorMessage?: string;
  metadata?: DocumentMetadata;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
} 