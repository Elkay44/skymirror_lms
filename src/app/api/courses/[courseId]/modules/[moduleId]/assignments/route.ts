import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema for creating a new assignment
const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string
  isPublished: z.boolean().optional(),
  maxScore: z.number().min(0).optional(),
  submissionType: z.enum(['TEXT', 'FILE', 'LINK', 'MULTIPLE_FILES']).optional(),
  allowLateSubmissions: z.boolean().optional(),
  resources: z.array(
    z.object({
      title: z.string(),
      url: z.string().url(),
      type: z.enum(['LINK', 'FILE', 'VIDEO']),
    })
  ).optional(),
  rubric: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      points: z.number().int().min(0),
      criteriaLevels: z.array(
        z.object({
          level: z.string(),
          description: z.string(),
          points: z.number().int().min(0)
        })
      ).optional(),
    })
  ).optional(),
});

// Log assignment activity
const logAssignmentActivity = async (userId: string | number, action: string, assignmentId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId.toString(),
        action,
        entityType: 'assignment',
        entityId: assignmentId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log assignment activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
};

// GET /api/courses/[courseId]/modules/[moduleId]/assignments - Get all assignments for a module
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    const { courseId, moduleId } = params;

    // Get session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Not authenticated or invalid session' }, { status: 401 });
    }

    // Get user ID from session (guaranteed to exist after the check above)
    const userId = session.user.id;

    // Check if user is instructor or enrolled in the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    const isInstructor = course?.instructorId === parseInt(userId.toString(), 10);

    if (!isInstructor) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: { 
          userId: parseInt(userId.toString(), 10), 
          courseId, 
          status: { in: ['ACTIVE', 'COMPLETED'] } 
        },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to view assignments' },
          { status: 403 }
        );
      }
    }

    // Get assignments for this module
    const assignments = await prisma.assignment.findMany({
      where: { moduleId },
      include: {
        resources: {
          orderBy: { order: 'asc' }
        },
        rubricItems: {
          orderBy: { order: 'asc' },
          include: {
            criteriaLevels: {
              orderBy: { points: 'desc' }
            }
          }
        },
        _count: {
          select: { 
            submissions: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // For students, include their own submission status if any
    let assignmentsWithSubmissionStatus = assignments;
    
    if (!isInstructor) {
      const submissionData = await Promise.all(
        assignments.map(async (assignment) => {
          const submission = await prisma.assignmentSubmission.findFirst({
            where: {
              assignmentId: assignment.id,
              userId: parseInt(userId.toString(), 10)
            },
            select: {
              id: true,
              status: true,
              submittedAt: true,
              grade: true,
              feedback: true
            }
          });
          
          return {
            ...assignment,
            userSubmission: submission || null
          };
        })
      );
      
      assignmentsWithSubmissionStatus = submissionData;
    }

    return NextResponse.json({
      data: assignmentsWithSubmissionStatus,
      total: assignments.length
    });
  } catch (error) {
    console.error('[ASSIGNMENTS_GET]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/assignments - Create a new assignment
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  console.log(`[ASSIGNMENT_CREATE] Starting request for course: ${params.courseId}, module: ${params.moduleId}`);
  try {
    const { courseId, moduleId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user is an instructor for this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: parseInt(userId.toString(), 10)
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'You must be the instructor of this course to create assignments' },
        { status: 403 }
      );
    }

    // Verify module exists and belongs to this course
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

    // Parse and validate request
    const body = await request.json();
    console.log(`[ASSIGNMENT_CREATE] Received data:`, body);
    
    // Log request data for debugging
    const requestSubmissionType = body?.submissionType;
    if (requestSubmissionType && !['TEXT', 'FILE', 'LINK', 'MULTIPLE_FILES'].includes(requestSubmissionType)) {
      console.warn(`[ASSIGNMENT_CREATE] Invalid submissionType: ${requestSubmissionType}`);
    }
    
    const validationResult = createAssignmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { 
      title, 
      description, 
      instructions, 
      dueDate, 
      isPublished = false, 
      maxScore = 100,
      submissionType = 'TEXT',
      allowLateSubmissions = false,
      resources,
      rubric
    } = validationResult.data;

    // Create assignment first, then add related items
    let createdAssignment;
    let assignmentResources = [];
    let assignmentRubricItems = [];
    
    try {
      // Create assignment
      console.log('[ASSIGNMENT_CREATE] Creating assignment with data:', {
        title,
        moduleId,
        submissionType,
      });
      
      createdAssignment = await prisma.assignment.create({
        data: {
          title,
          description: description || null,
          instructions: instructions || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          isPublished,
          maxScore,
          submissionType,
          allowLateSubmissions,
          moduleId: moduleId, // Direct field assignment instead of Prisma relation syntax
        }
      });
      
      console.log('[ASSIGNMENT_CREATE] Assignment created:', createdAssignment);

      // Create resources if any
      if (resources && resources.length > 0) {
        for (const [index, resource] of resources.entries()) {
          const createdResource = await prisma.assignmentResource.create({
            data: {
              assignmentId: createdAssignment.id,
              title: resource.title,
              url: resource.url,
              type: resource.type,
              order: index
            }
          });
          assignmentResources.push(createdResource);
        }
      }

      // Create rubric items if any
      if (rubric && rubric.length > 0) {
        for (let i = 0; i < rubric.length; i++) {
          const rubricItem = rubric[i];
          const createdRubricItem = await prisma.rubricItem.create({
            data: {
              assignmentId: createdAssignment.id,
              title: rubricItem.title,
              description: rubricItem.description || null,
              points: rubricItem.points,
              order: i
            }
          });
          assignmentRubricItems.push(createdRubricItem);

          // Create criteria levels if any
          if (rubricItem.criteriaLevels && rubricItem.criteriaLevels.length > 0) {
            for (const level of rubricItem.criteriaLevels) {
              await prisma.criteriaLevel.create({
                data: {
                  rubricItemId: createdRubricItem.id,
                  level: level.level,
                  description: level.description,
                  points: level.points
                }
              });
            }
          }
        }
      }

      // Assemble the complete result with the resources and rubric items we've created
      const completeResult = {
        ...createdAssignment,
        resources: assignmentResources,
        rubricItems: assignmentRubricItems
      };
      
      return completeResult;
    } catch (error) {
      console.error('[ASSIGNMENT_CREATE] Error creating assignment:', error);
      throw error; // Re-throw to be caught by the outer try/catch
    }

    // Log activity if assignment was created successfully
    if (createdAssignment && typeof createdAssignment === 'object') {
      // Use optional chaining to safely access userId
      if (userId) {
        // Use non-null assertion operator since we've already checked userId exists
        await logAssignmentActivity(userId!.toString(), 'create_assignment', createdAssignment.id, { title });
      } else {
        console.log('[ASSIGNMENT_CREATE] No userId available for activity logging');
      }

      // Revalidate paths
      revalidatePath(`/courses/${courseId}`);
      revalidatePath(`/courses/${courseId}/modules/${moduleId}`);

      return NextResponse.json({
        data: createdAssignment
      });
    } else {
      throw new Error('Failed to create a valid assignment object');
    }
  } catch (error: any) {
    console.error('[ASSIGNMENT_CREATE] Error details:', error);
    
    if (error instanceof Error) {
      console.error('[ASSIGNMENT_CREATE] Error name:', error.name);
      console.error('[ASSIGNMENT_CREATE] Error message:', error.message);
      console.error('[ASSIGNMENT_CREATE] Error stack:', error.stack);
      
      // Check for specific error types
      if (error.name === 'PrismaClientKnownRequestError') {
        // @ts-ignore
        const prismaError = error as { code: string; meta?: any };
        console.error('[ASSIGNMENT_CREATE] Prisma error code:', prismaError.code);
        console.error('[ASSIGNMENT_CREATE] Prisma error meta:', prismaError.meta);
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create assignment', 
          message: error.message,
          name: error.name
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
