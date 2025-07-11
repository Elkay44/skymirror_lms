import { z } from 'zod';

// Base schemas for reusable validation
const courseBaseSchema = {
  title: z.string().min(5, 'Title must be at least 5 characters'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  language: z.string().default('en'),
  imageUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  promoVideoUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  requirements: z.array(z.string().min(1, 'Requirement cannot be empty')).min(1, 'At least one requirement is required'),
  learningOutcomes: z.array(z.string().min(1, 'Learning outcome cannot be empty')).min(1, 'At least one learning outcome is required'),
  targetAudience: z.array(z.string().min(1, 'Target audience cannot be empty')).min(1, 'At least one target audience is required'),
  isPublished: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  price: z.number().nonnegative().default(0),
  featured: z.boolean().default(false),
  duration: z.number().int().positive().optional(),
};

// Course status enum for consistent usage
export const CourseStatus = z.enum([
  'DRAFT',
  'PUBLISHED', 
  'ARCHIVED', 
  'PENDING_APPROVAL', 
  'CHANGES_REQUESTED', 
  'REJECTED',
  'DISABLED'
]);

export type CourseStatus = z.infer<typeof CourseStatus>;

// Schema for creating a new course
export const courseFormSchema = z.object({
  ...courseBaseSchema,
  imagePreview: z.string().min(1, 'Course image is required'),
  status: CourseStatus.optional().default('DRAFT'),
  requiresApproval: z.boolean().optional(),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

// Schema for updating courses - all fields are optional
export const courseUpdateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').optional(),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters').optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required').optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  language: z.string().optional(),
  imageUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  promoVideoUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  requirements: z.array(z.string().min(1, 'Requirement cannot be empty')).optional(),
  learningOutcomes: z.array(z.string().min(1, 'Learning outcome cannot be empty')).optional(),
  targetAudience: z.array(z.string().min(1, 'Target audience cannot be empty')).optional(),
  isPublished: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  featured: z.boolean().optional(),
  price: z.number().nonnegative().optional(),
  status: CourseStatus.optional(),
  requiresApproval: z.boolean().optional(),
  duration: z.number().int().positive().optional(),
});

export type CourseUpdateValues = z.infer<typeof courseUpdateSchema>;

// Course search and filter parameters schema
export const courseSearchSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum([
    'title', 
    'createdAt', 
    'price', 
    'popularity', 
    'rating',
    'enrollmentCount',
    'updatedAt'
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  instructor: z.string().optional(),
  priceRange: z.object({
    min: z.coerce.number().nonnegative().optional(),
    max: z.coerce.number().nonnegative().optional(),
  }).optional(),
  status: z.enum(['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED', 'PENDING_APPROVAL']).default('ALL'),
  featured: z.enum(['ALL', 'YES', 'NO']).optional().default('ALL'),
  language: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  includeDrafts: z.boolean().optional().default(false),
});

export type CourseSearchParams = z.infer<typeof courseSearchSchema>;

// Schema for batch operations on courses
export const courseBatchOperationSchema = z.object({
  courseIds: z.array(z.string()).min(1, 'At least one course ID is required'),
  operation: z.enum([
    'delete',
    'publish',
    'unpublish',
    'archive',
    'set-featured',
    'unset-featured',
    'set-category',
    'set-status',
    'update-settings'
  ]),
  data: z.object({
    category: z.string().optional(),
    status: CourseStatus.optional(),
    featured: z.boolean().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    language: z.string().optional(),
    price: z.number().nonnegative().optional(),
    requiresApproval: z.boolean().optional(),
  }).optional(),
});

export type CourseBatchOperation = z.infer<typeof courseBatchOperationSchema>;

// Schema for course duplication options
export const courseDuplicationSchema = z.object({
  title: z.string().min(3).optional(),
  duplicateModules: z.boolean().default(true),
  duplicateLessons: z.boolean().default(true),
  duplicateQuizzes: z.boolean().default(true),
  duplicateContent: z.boolean().default(true),
  setAsDraft: z.boolean().default(true),
});

export type CourseDuplicationOptions = z.infer<typeof courseDuplicationSchema>;

// Schema for course versioning
export const courseVersionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  isAutosave: z.boolean().default(false),
});

export type CourseVersionData = z.infer<typeof courseVersionSchema>;

// Schema for course access control
export const accessControlSchema = z.object({
  moduleId: z.string().optional(),
  lessonId: z.string().optional(),
  isPublic: z.boolean().optional(),
  requiresEnrollment: z.boolean().optional(),
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
  prerequisites: z.array(
    z.object({
      type: z.enum(['MODULE', 'LESSON']),
      id: z.string(),
    })
  ).optional(),
});

export type AccessControlData = z.infer<typeof accessControlSchema>;

// Schema for course approval actions
export const courseApprovalSchema = z.object({
  courseId: z.string(),
  action: z.enum(['approve', 'reject', 'request-changes']),
  comments: z.string().optional(),
  publishOnApproval: z.boolean().default(true)
});

export type CourseApprovalAction = z.infer<typeof courseApprovalSchema>;

// Schema for bulk approval actions
export const bulkApprovalSchema = z.object({
  courseIds: z.array(z.string()).min(1),
  action: z.enum(['approve', 'reject', 'request-changes']),
  comments: z.string().optional(),
  publishOnApproval: z.boolean().default(true)
});

export type BulkApprovalAction = z.infer<typeof bulkApprovalSchema>;
