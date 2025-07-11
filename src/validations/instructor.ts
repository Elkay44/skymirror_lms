import { z } from 'zod';

/**
 * Instructor status enum for consistent usage
 */
export const InstructorStatus = z.enum([
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
  'ACTIVE'
]);

export type InstructorStatus = z.infer<typeof InstructorStatus>;

/**
 * Schema for creating a new instructor
 */
export const instructorCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
  bio: z.string().max(1000, 'Bio must be 1000 characters or less').optional(),
  expertise: z.array(z.string()).min(1, 'At least one expertise is required').optional(),
  website: z.string().url('Invalid website URL').or(z.literal('')).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').or(z.literal('')).optional(),
  socialLinks: z.object({
    twitter: z.string().url('Invalid Twitter URL').or(z.literal('')).optional(),
    linkedin: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
    youtube: z.string().url('Invalid YouTube URL').or(z.literal('')).optional(),
    github: z.string().url('Invalid GitHub URL').or(z.literal('')).optional(),
    instagram: z.string().url('Invalid Instagram URL').or(z.literal('')).optional(),
  }).optional(),
  status: InstructorStatus.optional().default('PENDING_APPROVAL'),
  sendWelcomeEmail: z.boolean().optional().default(true),
});

export type InstructorCreateData = z.infer<typeof instructorCreateSchema>;

/**
 * Schema for updating an instructor
 */
export const instructorUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  bio: z.string().max(1000, 'Bio must be 1000 characters or less').optional(),
  expertise: z.array(z.string()).min(1, 'At least one expertise is required').optional(),
  website: z.string().url('Invalid website URL').or(z.literal('')).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').or(z.literal('')).optional(),
  socialLinks: z.object({
    twitter: z.string().url('Invalid Twitter URL').or(z.literal('')).optional(),
    linkedin: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
    youtube: z.string().url('Invalid YouTube URL').or(z.literal('')).optional(),
    github: z.string().url('Invalid GitHub URL').or(z.literal('')).optional(),
    instagram: z.string().url('Invalid Instagram URL').or(z.literal('')).optional(),
  }).optional(),
  status: InstructorStatus.optional(),
  payoutSettings: z.object({
    method: z.string().optional(),
    accountDetails: z.record(z.string()).optional(),
  }).optional(),
  notificationSettings: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    courseEnrollments: z.boolean().optional(),
    courseReviews: z.boolean().optional(),
    discussions: z.boolean().optional(),
  }).optional(),
  customBranding: z.object({
    colors: z.object({
      primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').optional(),
      secondary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').optional(),
      accent: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').optional(),
    }).optional(),
    logo: z.string().url('Invalid logo URL').optional(),
  }).optional(),
});

export type InstructorUpdateData = z.infer<typeof instructorUpdateSchema>;

/**
 * Schema for instructor search and filter parameters
 */
export const instructorSearchSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(['name', 'createdAt', 'courseCount', 'enrollmentCount', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['ALL', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ACTIVE']).default('ALL'),
  expertise: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  hasPublishedCourses: z.enum(['ALL', 'YES', 'NO']).optional().default('ALL'),
});

export type InstructorSearchParams = z.infer<typeof instructorSearchSchema>;

/**
 * Schema for instructor batch status update
 */
export const instructorBatchStatusSchema = z.object({
  instructorIds: z.array(z.number()).min(1, 'At least one instructor ID is required'),
  action: z.enum(['approve', 'reject', 'suspend', 'activate']),
  sendNotification: z.boolean().default(true),
  message: z.string().optional(),
});

export type InstructorBatchStatusUpdate = z.infer<typeof instructorBatchStatusSchema>;

/**
 * Schema for instructor permission update
 */
export const instructorPermissionsSchema = z.object({
  instructorId: z.number(),
  permissions: z.object({
    canCreateCourses: z.boolean().optional(),
    canEditOthersCourses: z.boolean().optional(),
    canManageCategories: z.boolean().optional(),
    canViewAnalytics: z.boolean().optional(),
    canModerateDiscussions: z.boolean().optional(),
    canModerateReviews: z.boolean().optional(),
    coursePublishApprovalRequired: z.boolean().optional(),
    maxCoursesAllowed: z.number().int().nonnegative().optional(),
  }),
});

export type InstructorPermissionUpdate = z.infer<typeof instructorPermissionsSchema>;
