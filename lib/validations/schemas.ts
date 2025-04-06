import { z } from 'zod'

// Document schemas
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(1, 'Content is required'),
  video_url: z.string().url('Invalid video URL').optional(),
  template_id: z.string().uuid('Invalid template ID').optional(),
  template_variables: z.record(z.string(), z.any()).optional(),
})

export const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).optional(),
  content: z.string().min(1, 'Content is required').optional(),
  video_url: z.string().url('Invalid video URL').optional(),
})

// Video schemas
export const createVideoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  url: z.string().url('Invalid video URL'),
  duration: z.number().int().positive('Duration must be positive'),
})

export const updateVideoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).optional(),
  url: z.string().url('Invalid video URL').optional(),
  duration: z.number().int().positive('Duration must be positive').optional(),
})

// Template schemas
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['document', 'video']),
  content: z.string().min(1, 'Content is required'),
  variables: z.array(
    z.object({
      name: z.string().min(1, 'Variable name is required'),
      type: z.enum(['text', 'number', 'date', 'select']),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
    })
  ),
  is_public: z.boolean().default(false),
})

export const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  type: z.enum(['document', 'video']).optional(),
  content: z.string().min(1, 'Content is required').optional(),
  variables: z.array(
    z.object({
      name: z.string().min(1, 'Variable name is required'),
      type: z.enum(['text', 'number', 'date', 'select']),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
    })
  ).optional(),
  is_public: z.boolean().optional(),
})

// User schemas
export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100).optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  timezone: z.string().min(1, 'Timezone is required').optional(),
})

// Search schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['document', 'video', 'template']).optional(),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
})

// Export all schemas
export const schemas = {
  document: {
    create: createDocumentSchema,
    update: updateDocumentSchema,
  },
  video: {
    create: createVideoSchema,
    update: updateVideoSchema,
  },
  template: {
    create: createTemplateSchema,
    update: updateTemplateSchema,
  },
  profile: {
    update: updateProfileSchema,
  },
  search: searchSchema,
} 