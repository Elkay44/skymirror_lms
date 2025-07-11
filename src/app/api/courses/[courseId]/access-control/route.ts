import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { withErrorHandling, CommonErrors } from '@/lib/api-response';
import { logCourseActivity } from '@/lib/activity-log';
import { cache } from '@/lib/cache';
import { 
  moduleAccessControlSchema,
  lessonAccessControlSchema,
  batchAccessControlSchema
} from '@/validations/access-control';
import { requireCourseOwnerOrAdmin } from '@/middleware/auth-middleware';

// Schema for getting access control settings
const getAccessControlQuerySchema = z.object({
  type: z.enum(['module', 'lesson', 'all']).default('all'),
  moduleId: z.string().optional(),
  lessonId: z.string().optional(),
});

// Dynamic route to ensure data is not cached
export const dynamic = 'force-dynamic';

/**
 * GET /api/courses/[courseId]/access-control - Get access control settings
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  return withErrorHandling(async () => {
    const { courseId } = params;
    
    // Check authorization
    const authError = await requireCourseOwnerOrAdmin(req, courseId);
    if (authError) return authError;
    
    // Parse query parameters
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const { type, moduleId, lessonId } = getAccessControlQuerySchema.parse(searchParams);
    
    // Get course to verify it exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true }
    });
    
    if (!course) {
      return CommonErrors.notFound('Course not found');
    }
    
    // Fetch access control settings based on type
    let result: any = {};
    
    // Handle module-specific access control
    if (type === 'module' || type === 'all') {
      const moduleFilter: any = { courseId };
      if (moduleId) moduleFilter.id = moduleId;
      
      const modules = await prisma.module.findMany({
        where: moduleFilter,
        select: {
          id: true,
          title: true,
          isPublic: true,
          requiresEnrollment: true,
          availableFrom: true,
          availableUntil: true,
          prerequisites: {
            include: {
              prerequisite: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      });
      
      result.modules = modules.map(module => ({
        id: module.id,
        title: module.title,
        accessControl: {
          isPublic: module.isPublic ?? true,
          requiresEnrollment: module.requiresEnrollment ?? true,
          availableFrom: module.availableFrom,
          availableUntil: module.availableUntil
        },
        prerequisites: module.prerequisites.map(prereq => ({
          id: prereq.prerequisiteId,
          title: prereq.prerequisite.title,
          type: 'MODULE',
          requiredStatus: prereq.requiredStatus
        }))
      }));
    }
    
    // Handle lesson-specific access control
    if (type === 'lesson' || type === 'all') {
      const lessonFilter: any = {};
      if (lessonId) {
        lessonFilter.id = lessonId;
      } else {
        lessonFilter.module = {
          courseId
        };
      }
      
      if (moduleId) {
        lessonFilter.moduleId = moduleId;
      }
      
      const lessons = await prisma.lesson.findMany({
        where: lessonFilter,
        select: {
          id: true,
          title: true,
          moduleId: true,
          isPublic: true,
          requiresEnrollment: true,
          availableFrom: true,
          availableUntil: true,
          prerequisites: {
            include: {
              prerequisite: true
            }
          }
        }
      });
      
      result.lessons = lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        moduleId: lesson.moduleId,
        accessControl: {
          isPublic: lesson.isPublic ?? false,
          requiresEnrollment: lesson.requiresEnrollment ?? true,
          availableFrom: lesson.availableFrom,
          availableUntil: lesson.availableUntil
        },
        prerequisites: lesson.prerequisites.map(prereq => {
          // Determine prerequisite type and get title
          let prereqType: string;
          let prereqTitle: string;
          
          if ('title' in prereq.prerequisite) {
            if ('content' in prereq.prerequisite) {
              prereqType = 'LESSON';
              prereqTitle = (prereq.prerequisite as any).title;
            } else if ('questions' in prereq.prerequisite) {
              prereqType = 'QUIZ';
              prereqTitle = (prereq.prerequisite as any).title;
            } else {
              prereqType = 'MODULE';
              prereqTitle = (prereq.prerequisite as any).title;
            }
          } else {
            prereqType = 'ENROLLMENT';
            prereqTitle = 'Course Enrollment';
          }
          
          return {
            id: prereq.prerequisiteId,
            title: prereqTitle,
            type: prereqType,
            requiredStatus: prereq.requiredStatus
          };
        })
      }));
    }
    
    return NextResponse.json(result);
  }, 'Error fetching access control settings');
}

/**
 * POST /api/courses/[courseId]/access-control - Update access control settings
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  return withErrorHandling(async () => {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }
    
    const userId = Number(session.user.id);
    
    // Check if user is instructor for this course or admin
    const authError = await requireCourseOwnerOrAdmin(req, courseId);
    if (authError) return authError;
    
    // Parse request body
    const body = await req.json();
    
    // Check if this is a module access control update
    if ('moduleId' in body && !('lessonId' in body)) {
      // Validate module access control data
      const data = moduleAccessControlSchema.parse(body);
      
      // Check if module belongs to course
      const module = await prisma.module.findFirst({
        where: {
          id: data.moduleId,
          courseId
        }
      });
      
      if (!module) {
        return CommonErrors.notFound('Module not found or does not belong to this course');
      }
      
      // Update module access control settings
      const updatedModule = await prisma.module.update({
        where: { id: data.moduleId },
        data: {
          isPublic: data.isPublic,
          requiresEnrollment: data.requiresEnrollment,
          availableFrom: data.availableFrom,
          availableUntil: data.availableUntil,
        }
      });
      
      // Handle prerequisites if provided
      if (data.prerequisites && data.prerequisites.length > 0) {
        // Delete existing prerequisites
        await prisma.modulePrerequisite.deleteMany({
          where: { moduleId: data.moduleId }
        });
        
        // Create new prerequisites
        for (const prereq of data.prerequisites) {
          await prisma.modulePrerequisite.create({
            data: {
              moduleId: data.moduleId,
              prerequisiteId: prereq.id,
              requiredStatus: prereq.requiredStatus
            }
          });
        }
      }
      
      // Log activity
      await logCourseActivity(
        userId,
        courseId,
        'update',
        {
          entityType: 'module',
          entityId: data.moduleId,
          accessControl: {
            isPublic: data.isPublic,
            requiresEnrollment: data.requiresEnrollment,
            availableFrom: data.availableFrom,
            availableUntil: data.availableUntil,
          }
        }
      );
      
      // Invalidate cache
      await cache.invalidate('course', courseId);
      
      return NextResponse.json({
        message: 'Module access control settings updated successfully',
        moduleId: data.moduleId
      });
    } 
    // Check if this is a lesson access control update
    else if ('lessonId' in body) {
      // Validate lesson access control data
      const data = lessonAccessControlSchema.parse(body);
      
      // Check if lesson belongs to course
      const lesson = await prisma.lesson.findFirst({
        where: {
          id: data.lessonId,
          module: {
            courseId
          }
        }
      });
      
      if (!lesson) {
        return CommonErrors.notFound('Lesson not found or does not belong to this course');
      }
      
      // Update lesson access control settings
      const updatedLesson = await prisma.lesson.update({
        where: { id: data.lessonId },
        data: {
          isPublic: data.isPublic,
          requiresEnrollment: data.requiresEnrollment,
          availableFrom: data.availableFrom,
          availableUntil: data.availableUntil,
        }
      });
      
      // Handle prerequisites if provided
      if (data.prerequisites && data.prerequisites.length > 0) {
        // Delete existing prerequisites
        await prisma.lessonPrerequisite.deleteMany({
          where: { lessonId: data.lessonId }
        });
        
        // Create new prerequisites
        for (const prereq of data.prerequisites) {
          await prisma.lessonPrerequisite.create({
            data: {
              lessonId: data.lessonId,
              prerequisiteType: prereq.type,
              prerequisiteId: prereq.id,
              requiredStatus: prereq.requiredStatus
            }
          });
        }
      }
      
      // Log activity
      await logCourseActivity(
        userId,
        courseId,
        'update',
        {
          entityType: 'lesson',
          entityId: data.lessonId,
          accessControl: {
            isPublic: data.isPublic,
            requiresEnrollment: data.requiresEnrollment,
            availableFrom: data.availableFrom,
            availableUntil: data.availableUntil,
          }
        }
      );
      
      // Invalidate cache
      await cache.invalidate('course', courseId);
      
      return NextResponse.json({
        message: 'Lesson access control settings updated successfully',
        lessonId: data.lessonId
      });
    } 
    // Check if this is a batch access control update
    else if ('resourceType' in body && 'resourceIds' in body) {
      // Validate batch access control data
      const data = batchAccessControlSchema.parse(body);
      
      const result = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      if (data.resourceType === 'MODULE') {
        // Verify all modules belong to the course
        const modules = await prisma.module.findMany({
          where: {
            id: { in: data.resourceIds },
            courseId
          },
          select: { id: true }
        });
        
        const validModuleIds = modules.map(m => m.id);
        const invalidModuleIds = data.resourceIds.filter(id => !validModuleIds.includes(id));
        
        if (invalidModuleIds.length > 0) {
          return CommonErrors.badRequest(
            `Some modules do not exist or do not belong to this course: ${invalidModuleIds.join(', ')}`
          );
        }
        
        // Update modules
        for (const moduleId of data.resourceIds) {
          try {
            await prisma.module.update({
              where: { id: moduleId },
              data: {
                isPublic: data.settings.isPublic,
                requiresEnrollment: data.settings.requiresEnrollment,
                availableFrom: data.settings.availableFrom,
                availableUntil: data.settings.availableUntil,
              }
            });
            
            result.success++;
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to update module ${moduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else if (data.resourceType === 'LESSON') {
        // Verify all lessons belong to the course
        const lessons = await prisma.lesson.findMany({
          where: {
            id: { in: data.resourceIds },
            module: {
              courseId
            }
          },
          select: { id: true }
        });
        
        const validLessonIds = lessons.map(l => l.id);
        const invalidLessonIds = data.resourceIds.filter(id => !validLessonIds.includes(id));
        
        if (invalidLessonIds.length > 0) {
          return CommonErrors.badRequest(
            `Some lessons do not exist or do not belong to this course: ${invalidLessonIds.join(', ')}`
          );
        }
        
        // Update lessons
        for (const lessonId of data.resourceIds) {
          try {
            await prisma.lesson.update({
              where: { id: lessonId },
              data: {
                isPublic: data.settings.isPublic,
                requiresEnrollment: data.settings.requiresEnrollment,
                availableFrom: data.settings.availableFrom,
                availableUntil: data.settings.availableUntil,
              }
            });
            
            result.success++;
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to update lesson ${lessonId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else if (data.resourceType === 'COURSE') {
        // Verify this is the correct course
        if (data.resourceIds.length !== 1 || data.resourceIds[0] !== courseId) {
          return CommonErrors.badRequest('Invalid course ID');
        }
        
        try {
          await prisma.course.update({
            where: { id: courseId },
            data: {
              isPublic: data.settings.isPublic,
              requiresEnrollment: data.settings.requiresEnrollment,
              availableFrom: data.settings.availableFrom,
              availableUntil: data.settings.availableUntil,
            }
          });
          
          result.success = 1;
        } catch (error) {
          result.failed = 1;
          result.errors.push(`Failed to update course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Log batch activity
      await logCourseActivity(
        userId,
        courseId,
        'batch_operation',
        {
          operation: 'update_access_control',
          resourceType: data.resourceType,
          resourceIds: data.resourceIds,
          settings: data.settings,
          result
        }
      );
      
      // Invalidate cache
      await cache.invalidate('course', courseId);
      
      return NextResponse.json({
        message: `Successfully updated ${result.success} of ${data.resourceIds.length} resources`,
        resourceType: data.resourceType,
        result
      });
    } else {
      return CommonErrors.badRequest('Invalid request body. Must specify moduleId, lessonId, or batch operation.');
    }
  }, 'Error updating access control settings');
}