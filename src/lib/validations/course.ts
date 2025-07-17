import { z } from 'zod';

export const courseUpdateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isPublished: z.boolean(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']),
  requirements: z.string().optional(),
  learningOutcomes: z.string().optional(),
  targetAudience: z.string().optional(),
  modules: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    order: z.number(),
    lessons: z.array(z.object({
      id: z.string().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      content: z.string().optional(),
      videoUrl: z.string().url().optional(),
      duration: z.number().optional(),
      order: z.number()
    }))
  }))
});
