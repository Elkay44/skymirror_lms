import { z } from 'zod';

/**
 * Resource type that can have access control applied to it
 */
export const AccessControlResourceType = z.enum([
  'COURSE',
  'MODULE',
  'LESSON'
]);

export type AccessControlResourceType = z.infer<typeof AccessControlResourceType>;

/**
 * Prerequisite type for access control
 */
export const PrerequisiteType = z.enum([
  'MODULE',
  'LESSON',
  'QUIZ',
  'ENROLLMENT'
]);

export type PrerequisiteType = z.infer<typeof PrerequisiteType>;

/**
 * Base schema for access control settings
 */
export const accessControlBaseSchema = z.object({
  isPublic: z.boolean().optional(),
  requiresEnrollment: z.boolean().optional(),
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
});

/**
 * Schema for module access control settings
 */
export const moduleAccessControlSchema = accessControlBaseSchema.extend({
  moduleId: z.string(),
  prerequisites: z.array(
    z.object({
      type: PrerequisiteType,
      id: z.string(),
      requiredStatus: z.enum(['COMPLETED', 'STARTED', 'ANY']).default('COMPLETED')
    })
  ).optional()
});

export type ModuleAccessControl = z.infer<typeof moduleAccessControlSchema>;

/**
 * Schema for lesson access control settings
 */
export const lessonAccessControlSchema = accessControlBaseSchema.extend({
  lessonId: z.string(),
  moduleId: z.string().optional(),
  prerequisites: z.array(
    z.object({
      type: PrerequisiteType,
      id: z.string(),
      requiredStatus: z.enum(['COMPLETED', 'STARTED', 'ANY']).default('COMPLETED')
    })
  ).optional()
});

export type LessonAccessControl = z.infer<typeof lessonAccessControlSchema>;

/**
 * Schema for course access control settings
 */
export const courseAccessControlSchema = accessControlBaseSchema.extend({
  courseId: z.string(),
  enrollmentRequirement: z.enum(['NONE', 'ACCOUNT_ONLY', 'PAYMENT_REQUIRED', 'INVITE_ONLY']).optional(),
  maxEnrollments: z.number().int().positive().optional(),
  enrollmentStartDate: z.string().datetime().optional(),
  enrollmentEndDate: z.string().datetime().optional(),
});

export type CourseAccessControl = z.infer<typeof courseAccessControlSchema>;

/**
 * Schema for batch updating access control settings
 */
export const batchAccessControlSchema = z.object({
  resourceType: AccessControlResourceType,
  resourceIds: z.array(z.string()).min(1),
  settings: z.object({
    isPublic: z.boolean().optional(),
    requiresEnrollment: z.boolean().optional(),
    availableFrom: z.string().datetime().optional().nullable(),
    availableUntil: z.string().datetime().optional().nullable(),
  })
});

export type BatchAccessControlUpdate = z.infer<typeof batchAccessControlSchema>;

/**
 * Schema for checking user access to a resource
 */
export const accessCheckSchema = z.object({
  userId: z.number().int().positive(),
  resourceType: AccessControlResourceType,
  resourceId: z.string()
});

export type AccessCheckParams = z.infer<typeof accessCheckSchema>;

/**
 * Schema for prerequisite creation
 */
export const prerequisiteCreateSchema = z.object({
  resourceType: AccessControlResourceType,
  resourceId: z.string(),
  prerequisiteType: PrerequisiteType,
  prerequisiteId: z.string(),
  requiredStatus: z.enum(['COMPLETED', 'STARTED', 'ANY']).default('COMPLETED')
});

export type PrerequisiteCreate = z.infer<typeof prerequisiteCreateSchema>;

/**
 * Schema for prerequisite deletion
 */
export const prerequisiteDeleteSchema = z.object({
  prerequisiteId: z.string(),
});

export type PrerequisiteDelete = z.infer<typeof prerequisiteDeleteSchema>;

/**
 * Schema for module prerequisite
 */
export const modulePrerequisiteSchema = z.object({
  moduleId: z.string(),
  prerequisiteId: z.string(),
  requiredStatus: z.enum(['COMPLETED', 'STARTED', 'ANY']).default('COMPLETED'),
});

export type ModulePrerequisite = z.infer<typeof modulePrerequisiteSchema>;

/**
 * Schema for lesson prerequisite
 */
export const lessonPrerequisiteSchema = z.object({
  lessonId: z.string(),
  prerequisiteType: PrerequisiteType,
  prerequisiteId: z.string(),
  requiredStatus: z.enum(['COMPLETED', 'STARTED', 'ANY']).default('COMPLETED'),
});

export type LessonPrerequisite = z.infer<typeof lessonPrerequisiteSchema>;
