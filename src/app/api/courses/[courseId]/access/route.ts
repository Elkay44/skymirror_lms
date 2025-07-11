import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for module access control
const moduleAccessSchema = z.object({
  moduleId: z.string(),
  isPublic: z.boolean().optional(),
  requiresEnrollment: z.boolean().optional(),
  availableAfter: z.string().optional().refine(val => {
    return !val || !isNaN(Date.parse(val));
  }, {
    message: "availableAfter must be a valid date string"
  }),
  prereqModuleIds: z.array(z.string()).optional()
});

// Schema for lesson access control
const lessonAccessSchema = z.object({
  lessonId: z.string(),
  moduleId: z.string(),
  isPublic: z.boolean().optional(),
  requiresEnrollment: z.boolean().optional(),
  availableAfter: z.string().optional().refine(val => {
    return !val || !isNaN(Date.parse(val));
  }, {
    message: "availableAfter must be a valid date string"
  }),
  prereqLessonIds: z.array(z.string()).optional()
});

// Schema for batch access control
const batchAccessSchema = z.object({
  modules: z.array(moduleAccessSchema).optional(),
  lessons: z.array(lessonAccessSchema).optional()
});

// Dynamic route to ensure data is not cached
export const dynamic = 'force-dynamic';

// GET /api/courses/[courseId]/access - Get access control settings for a course
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    
    // Check if user is instructor for this course or admin
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    const isInstructor = course.instructorId === userId;
    const isAdmin = user?.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to view access control settings for this course' },
        { status: 403 }
      );
    }
    
    // Get all modules with their access control settings
    const modules = await prisma.module.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        order: true,
        description: true
      },
      orderBy: { order: 'asc' }
    });
    
    // Get all lessons with their access control settings
    const lessons = await prisma.lesson.findMany({
      where: {
        module: {
          courseId
        }
      },
      select: {
        id: true,
        title: true,
        order: true,
        moduleId: true,
        content: true,
        videoUrl: true,
        duration: true,
        sectionId: true
        // Note: isPublic, requiresEnrollment, availableAfter, and prerequisites 
        // fields are not in the schema yet
      },
      orderBy: [
        { module: { order: 'asc' } },
        { order: 'asc' }
      ]
    });
    
    // Transform module data (limited to available fields in schema)
    const transformedModules = modules.map(module => ({
      id: module.id,
      title: module.title,
      order: module.order,
      description: module.description
      // Note: Access control fields not present in schema
      // These would typically include: isPublic, requiresEnrollment, availableAfter, prerequisites
    }));
    
    // Transform lesson data (limited to available fields in schema)
    const transformedLessons = lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      moduleId: lesson.moduleId,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      duration: lesson.duration,
      sectionId: lesson.sectionId
      // Note: Access control fields not present in schema
      // These would typically include: isPublic, requiresEnrollment, availableAfter, prerequisites
    }));
    
    return NextResponse.json({
      modules: transformedModules,
      lessons: transformedLessons
    });
  } catch (error) {
    console.error('[GET_ACCESS_CONTROL_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch access control settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/access - Update access control settings for modules/lessons
export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    
    // Check if user is instructor for this course or admin
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    const isInstructor = course.instructorId === userId;
    const isAdmin = user?.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to update access control settings for this course' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const { modules, lessons } = batchAccessSchema.parse(body);
    
    const moduleUpdates: Promise<any>[] = [];
    const lessonUpdates: Promise<any>[] = [];
    const errors: any[] = [];
    
    // Process module updates
    if (modules && modules.length > 0) {
      for (const module of modules) {
        // Verify the module belongs to this course
        const existingModule = await prisma.module.findUnique({
          where: { id: module.moduleId },
          select: { courseId: true }
        });
        
        if (!existingModule || existingModule.courseId !== courseId) {
          errors.push({
            moduleId: module.moduleId,
            error: 'Module not found or does not belong to this course'
          });
          continue;
        }
        
        // Prepare update data
        const updateData: any = {};
        
        if (typeof module.isPublic === 'boolean') {
          updateData.isPublic = module.isPublic;
        }
        
        if (typeof module.requiresEnrollment === 'boolean') {
          updateData.requiresEnrollment = module.requiresEnrollment;
        }
        
        if (module.availableAfter !== undefined) {
          updateData.availableAfter = module.availableAfter ? new Date(module.availableAfter) : null;
        }
        
        // Update module
        const updatePromise = prisma.module.update({
          where: { id: module.moduleId },
          data: updateData
        });
        
        moduleUpdates.push(updatePromise);
        
        // Handle prerequisites if provided
        if (module.prereqModuleIds) {
          // Delete existing prerequisites
          const deletePrereqs = prisma.modulePrerequisite.deleteMany({
            where: { moduleId: module.moduleId }
          });
          
          moduleUpdates.push(deletePrereqs);
          
          // Create new prerequisites
          for (const prereqId of module.prereqModuleIds) {
            // Verify prerequisite module exists and belongs to this course
            const prereqModule = await prisma.module.findUnique({
              where: { id: prereqId },
              select: { courseId: true }
            });
            
            if (!prereqModule || prereqModule.courseId !== courseId) {
              errors.push({
                moduleId: module.moduleId,
                prereqId,
                error: 'Prerequisite module not found or does not belong to this course'
              });
              continue;
            }
            
            // Create prerequisite
            const createPrereq = prisma.modulePrerequisite.create({
              data: {
                moduleId: module.moduleId,
                prerequisiteId: prereqId
              }
            });
            
            moduleUpdates.push(createPrereq);
          }
        }
      }
    }
    
    // Process lesson updates
    if (lessons && lessons.length > 0) {
      for (const lesson of lessons) {
        // Verify the lesson belongs to this course
        const existingLesson = await prisma.lesson.findUnique({
          where: { id: lesson.lessonId },
          include: { module: true }
        });
        
        if (!existingLesson || !existingLesson.module || existingLesson.module.courseId !== courseId) {
          errors.push({
            lessonId: lesson.lessonId,
            error: 'Lesson not found or does not belong to this course'
          });
          continue;
        }
        
        // Verify the module ID is correct if provided
        if (lesson.moduleId && existingLesson.moduleId !== lesson.moduleId) {
          errors.push({
            lessonId: lesson.lessonId,
            error: 'Lesson does not belong to the specified module'
          });
          continue;
        }
        
        // Prepare update data
        const updateData: any = {};
        
        if (typeof lesson.isPublic === 'boolean') {
          updateData.isPublic = lesson.isPublic;
        }
        
        if (typeof lesson.requiresEnrollment === 'boolean') {
          updateData.requiresEnrollment = lesson.requiresEnrollment;
        }
        
        if (lesson.availableAfter !== undefined) {
          updateData.availableAfter = lesson.availableAfter ? new Date(lesson.availableAfter) : null;
        }
        
        // Update lesson
        const updatePromise = prisma.lesson.update({
          where: { id: lesson.lessonId },
          data: updateData
        });
        
        lessonUpdates.push(updatePromise);
        
        // Handle prerequisites if provided
        if (lesson.prereqLessonIds) {
          // Delete existing prerequisites
          const deletePrereqs = prisma.lessonPrerequisite.deleteMany({
            where: { lessonId: lesson.lessonId }
          });
          
          lessonUpdates.push(deletePrereqs);
          
          // Create new prerequisites
          for (const prereqId of lesson.prereqLessonIds) {
            // Verify prerequisite lesson exists and belongs to this course
            const prereqLesson = await prisma.lesson.findUnique({
              where: { id: prereqId },
              include: { module: true }
            });
            
            if (!prereqLesson || !prereqLesson.module || prereqLesson.module.courseId !== courseId) {
              errors.push({
                lessonId: lesson.lessonId,
                prereqId,
                error: 'Prerequisite lesson not found or does not belong to this course'
              });
              continue;
            }
            
            // Create prerequisite
            const createPrereq = prisma.lessonPrerequisite.create({
              data: {
                lessonId: lesson.lessonId,
                prerequisiteId: prereqId
              }
            });
            
            lessonUpdates.push(createPrereq);
          }
        }
      }
    }
    
    // Execute all updates in parallel
    await Promise.all([...moduleUpdates, ...lessonUpdates]);
    
    return NextResponse.json({
      message: 'Access control settings updated successfully',
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('[UPDATE_ACCESS_CONTROL_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update access control settings' },
      { status: 500 }
    );
  }
}
