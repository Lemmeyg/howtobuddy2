import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  videoUrl: z.string().url('Invalid URL').refine(
    (url) => url.includes('youtube.com') || url.includes('vimeo.com'),
    'Only YouTube and Vimeo URLs are supported'
  ),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  outputType: z.enum(['tutorial', 'guide', 'reference']).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'error']).optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
}); 