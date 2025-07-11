import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { invalidateCache } from '@/lib/cache';

// Schema for access control settings
const accessControlSchema = z.object({
  moduleId: z.string().optional(),
  lessonId: z.string().optional(),
  accessType: z.enum(['TIME_BASED', 'SEQUENTIAL', 'PREREQUISITE', 'ENROLLMENT_DURATION', 'USER_GROUP', 'CUSTOM']),
  settings: z.object({
    // TIME_BASED settings
    availableFrom: z.date().optional(),
    availableUntil: z.date().optional(),
    
    // SEQUENTIAL settings
    requirePrevious: z.boolean().optional(),
    waitDays: z.number().min(0).optional(),
    
    // PREREQUISITE settings
    prerequisiteIds: z.array(z.string()).optional(),
    prerequisiteType: z.enum(['MODULE', 'LESSON', 'QUIZ', 'COMPLETION_PERCENTAGE']).optional(),
    prerequisiteValue: z.number().optional(), // For completion percentage
    
    // ENROLLMENT_DURATION settings
    daysAfterEnrollment: z.number().min(0).optional(),
    
    // USER_GROUP settings
    allowedUserGroups: z.array(z.string()).optional(),
    
    // CUSTOM settings
    customLogic: z.string().optional(),
    customData: z.record(z.any()).optional()
  }),
  isEnabled: z.boolean().default(true),
  description: z.string().optional()
});

// Schema for bulk access control update
const bulkAccessControlSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    type: z.enum(['MODULE', 'LESSON']),
    accessType: z.enum(['TIME_BASED', 'SEQUENTIAL', 'PREREQUISITE', 'ENROLLMENT_DURATION', 'USER_GROUP', 'CUSTOM']),
    settings: z.object({}).passthrough(),
    isEnabled: z.boolean().default(true),
    description: z.string().optional()
  }))
});

// Schema for checking access
const checkAccessSchema = z.object({
  moduleId: z.string().optional(),
  lessonId: z.string().optional()
});

// Dynamic route to ensure data is not cached
export const dynamic = 'force-dynamic';

// GET /api/courses/[courseId]/access-controls - Get all access controls for a course
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
        { error: 'You are not authorized to view access controls for this course' },
        { status: 403 }
      );
    }
    
    // Get all access controls for this course
    const moduleAccessControls = await prisma.moduleAccessControl.findMany({
      where: {
        module: {
          courseId
        }
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            position: true
          }
        }
      },
      orderBy: {
        module: {
          position: 'asc'
        }
      }
    });
    
    const lessonAccessControls = await prisma.lessonAccessControl.findMany({
      where: {
        lesson: {
          module: {
            courseId
          }
        }
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            position: true,
            module: {
              select: {
                id: true,
                title: true,
                position: true
              }
            }
          }
        }
      },
      orderBy: {
        lesson: {
          position: 'asc'
        }
      }
    });
    
    // Format response
    const formattedModuleControls = moduleAccessControls.map(control => ({
      id: control.id,
      moduleId: control.moduleId,
      moduleName: control.module.title,
      type: 'MODULE',
      accessType: control.accessType,
      settings: control.settings,
      isEnabled: control.isEnabled,
      description: control.description,
      updatedAt: control.updatedAt
    }));
    
    const formattedLessonControls = lessonAccessControls.map(control => ({
      id: control.id,
      lessonId: control.lessonId,
      lessonName: control.lesson.title,
      moduleId: control.lesson.module.id,
      moduleName: control.lesson.module.title,
      type: 'LESSON',
      accessType: control.accessType,
      settings: control.settings,
      isEnabled: control.isEnabled,
      description: control.description,
      updatedAt: control.updatedAt
    }));
    
    return NextResponse.json({
      moduleControls: formattedModuleControls,
      lessonControls: formattedLessonControls
    });
  } catch (error) {
    console.error('[GET_ACCESS_CONTROLS_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get access controls', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/access-controls - Create or update access control
export async function POST(
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
      select: { instructorId: true, title: true }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true }
    });
    
    const isInstructor = course.instructorId === userId;
    const isAdmin = user?.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to manage access controls for this course' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Check if this is a bulk update or single update
    if (body.items && Array.isArray(body.items)) {
      // Validate bulk schema
      const { items } = bulkAccessControlSchema.parse(body);
      
      // Process each item in the batch
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
        updated: [] as Record<string, any>[]
      };
      
      for (const item of items) {
        try {
          const { id, type, accessType, settings, isEnabled, description } = item;
          
          // Verify the target exists and belongs to this course
          if (type === 'MODULE') {
            const module = await prisma.module.findFirst({
              where: {
                id,
                courseId
              }
            });
            
            if (!module) {
              results.failed++;
              results.errors.push(`Module with ID ${id} not found or does not belong to this course`);
              continue;
            }
            
            // Create or update module access control
            const existingControl = await prisma.moduleAccessControl.findFirst({
              where: {
                moduleId: id,
                accessType
              }
            });
            
            if (existingControl) {
              // Update existing
              const updated = await prisma.moduleAccessControl.update({
                where: {
                  id: existingControl.id
                },
                data: {
                  accessType,
                  settings,
                  isEnabled,
                  description
                }
              });
              
              results.success++;
              results.updated.push({
                id: updated.id,
                moduleId: updated.moduleId,
                type: 'MODULE',
                accessType: updated.accessType
              });
            } else {
              // Create new
              const created = await prisma.moduleAccessControl.create({
                data: {
                  moduleId: id,
                  accessType,
                  settings,
                  isEnabled,
                  description
                }
              });
              
              results.success++;
              results.updated.push({
                id: created.id,
                moduleId: created.moduleId,
                type: 'MODULE',
                accessType: created.accessType
              });
            }
          } 
          else if (type === 'LESSON') {
            const lesson = await prisma.lesson.findFirst({
              where: {
                id,
                module: {
                  courseId
                }
              }
            });
            
            if (!lesson) {
              results.failed++;
              results.errors.push(`Lesson with ID ${id} not found or does not belong to this course`);
              continue;
            }
            
            // Create or update lesson access control
            const existingControl = await prisma.lessonAccessControl.findFirst({
              where: {
                lessonId: id,
                accessType
              }
            });
            
            if (existingControl) {
              // Update existing
              const updated = await prisma.lessonAccessControl.update({
                where: {
                  id: existingControl.id
                },
                data: {
                  accessType,
                  settings,
                  isEnabled,
                  description
                }
              });
              
              results.success++;
              results.updated.push({
                id: updated.id,
                lessonId: updated.lessonId,
                type: 'LESSON',
                accessType: updated.accessType
              });
            } else {
              // Create new
              const created = await prisma.lessonAccessControl.create({
                data: {
                  lessonId: id,
                  accessType,
                  settings,
                  isEnabled,
                  description
                }
              });
              
              results.success++;
              results.updated.push({
                id: created.id,
                lessonId: created.lessonId,
                type: 'LESSON',
                accessType: created.accessType
              });
            }
          }
          
          // Log the activity
          await prisma.activityLog.create({
            data: {
              userId,
              action: 'UPDATE_ACCESS_CONTROL',
              details: `${user?.name || 'User'} updated access control for a ${type.toLowerCase()} in course "${course.title}"`,
              resourceId: id,
              resourceType: type
            }
          });
          
        } catch (error) {
          console.error(`Error processing access control for item ${item.id}:`, error);
          results.failed++;
          results.errors.push(`Failed to process item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Invalidate course cache
      await invalidateCache('course', courseId);
      
      return NextResponse.json({
        message: `Processed ${results.success} of ${items.length} access controls`,
        results
      });
    } 
    else {
      // Single update
      const { moduleId, lessonId, accessType, settings, isEnabled, description } = accessControlSchema.parse(body);
      
      if (!moduleId && !lessonId) {
        return NextResponse.json(
          { error: 'Either moduleId or lessonId must be provided' },
          { status: 400 }
        );
      }
      
      if (moduleId && lessonId) {
        return NextResponse.json(
          { error: 'Only one of moduleId or lessonId should be provided' },
          { status: 400 }
        );
      }
      
      let result;
      
      // Create or update module access control
      if (moduleId) {
        // Verify the module belongs to this course
        const module = await prisma.module.findFirst({
          where: {
            id: moduleId,
            courseId
          }
        });
        
        if (!module) {
          return NextResponse.json(
            { error: 'Module not found or does not belong to this course' },
            { status: 404 }
          );
        }
        
        // Check if access control already exists
        const existingControl = await prisma.moduleAccessControl.findFirst({
          where: {
            moduleId,
            accessType
          }
        });
        
        if (existingControl) {
          // Update existing
          result = await prisma.moduleAccessControl.update({
            where: {
              id: existingControl.id
            },
            data: {
              accessType,
              settings,
              isEnabled,
              description
            }
          });
        } else {
          // Create new
          result = await prisma.moduleAccessControl.create({
            data: {
              moduleId,
              accessType,
              settings,
              isEnabled,
              description
            }
          });
        }
        
        // Log the activity
        await prisma.activityLog.create({
          data: {
            userId,
            action: 'UPDATE_ACCESS_CONTROL',
            details: `${user?.name || 'User'} updated access control for module "${module.title}" in course "${course.title}"`,
            resourceId: moduleId,
            resourceType: 'MODULE'
          }
        });
      }
      // Create or update lesson access control
      else if (lessonId) {
        // Verify the lesson belongs to this course
        const lesson = await prisma.lesson.findFirst({
          where: {
            id: lessonId,
            module: {
              courseId
            }
          },
          include: {
            module: {
              select: {
                title: true
              }
            }
          }
        });
        
        if (!lesson) {
          return NextResponse.json(
            { error: 'Lesson not found or does not belong to this course' },
            { status: 404 }
          );
        }
        
        // Check if access control already exists
        const existingControl = await prisma.lessonAccessControl.findFirst({
          where: {
            lessonId,
            accessType
          }
        });
        
        if (existingControl) {
          // Update existing
          result = await prisma.lessonAccessControl.update({
            where: {
              id: existingControl.id
            },
            data: {
              accessType,
              settings,
              isEnabled,
              description
            }
          });
        } else {
          // Create new
          result = await prisma.lessonAccessControl.create({
            data: {
              lessonId,
              accessType,
              settings,
              isEnabled,
              description
            }
          });
        }
        
        // Log the activity
        await prisma.activityLog.create({
          data: {
            userId,
            action: 'UPDATE_ACCESS_CONTROL',
            details: `${user?.name || 'User'} updated access control for lesson "${lesson.title}" in module "${lesson.module.title}" in course "${course.title}"`,
            resourceId: lessonId,
            resourceType: 'LESSON'
          }
        });
      }
      
      // Invalidate course cache
      await invalidateCache('course', courseId);
      
      return NextResponse.json({
        message: 'Access control updated successfully',
        accessControl: result
      });
    }
  } catch (error) {
    console.error('[UPDATE_ACCESS_CONTROL_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update access control', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/access-controls - Remove access control
export async function DELETE(
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
        { error: 'You are not authorized to delete access controls for this course' },
        { status: 403 }
      );
    }
    
    // Parse request URL params
    const url = new URL(req.url);
    const controlId = url.searchParams.get('id');
    const controlType = url.searchParams.get('type');
    
    if (!controlId || !controlType) {
      return NextResponse.json(
        { error: 'Control ID and type must be provided as query parameters' },
        { status: 400 }
      );
    }
    
    if (!['MODULE', 'LESSON'].includes(controlType)) {
      return NextResponse.json(
        { error: 'Control type must be either MODULE or LESSON' },
        { status: 400 }
      );
    }
    
    // Delete the access control
    if (controlType === 'MODULE') {
      // Verify this control belongs to the course
      const control = await prisma.moduleAccessControl.findUnique({
        where: { id: controlId },
        include: {
          module: {
            select: {
              courseId: true,
              title: true
            }
          }
        }
      });
      
      if (!control || control.module.courseId !== courseId) {
        return NextResponse.json(
          { error: 'Access control not found or does not belong to this course' },
          { status: 404 }
        );
      }
      
      await prisma.moduleAccessControl.delete({
        where: { id: controlId }
      });
      
      // Log the activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'DELETE_ACCESS_CONTROL',
          details: `Access control removed from module "${control.module.title}"`,
          resourceId: control.moduleId,
          resourceType: 'MODULE'
        }
      });
    } 
    else {
      // Verify this control belongs to the course
      const control = await prisma.lessonAccessControl.findUnique({
        where: { id: controlId },
        include: {
          lesson: {
            select: {
              title: true,
              module: {
                select: {
                  courseId: true,
                  title: true
                }
              }
            }
          }
        }
      });
      
      if (!control || control.lesson.module.courseId !== courseId) {
        return NextResponse.json(
          { error: 'Access control not found or does not belong to this course' },
          { status: 404 }
        );
      }
      
      await prisma.lessonAccessControl.delete({
        where: { id: controlId }
      });
      
      // Log the activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'DELETE_ACCESS_CONTROL',
          details: `Access control removed from lesson "${control.lesson.title}" in module "${control.lesson.module.title}"`,
          resourceId: control.lessonId,
          resourceType: 'LESSON'
        }
      });
    }
    
    // Invalidate course cache
    await invalidateCache('course', courseId);
    
    return NextResponse.json({
      message: 'Access control deleted successfully'
    });
  } catch (error) {
    console.error('[DELETE_ACCESS_CONTROL_ERROR]', error);
    
    return NextResponse.json(
      { error: 'Failed to delete access control', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
