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
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Use a transaction to create assignment, resources, and rubric items
    const result = await prisma.$transaction(async (tx) => {
      // Create assignment
      const assignment = await tx.assignment.create({
        data: {
          title,
          description: description || null,
          instructions: instructions || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          isPublished,
          maxScore,
          submissionType,
          allowLateSubmissions,
          module: { connect: { id: moduleId } },
        }
      });

      // Create resources if any
      if (resources && resources.length > 0) {
        await tx.assignmentResource.createMany({
          data: resources.map((resource, index) => ({
            assignmentId: assignment.id,
            title: resource.title,
            url: resource.url,
            type: resource.type,
            order: index
          }))
        });
      }

      // Create rubric items if any
      if (rubric && rubric.length > 0) {
        for (let i = 0; i < rubric.length; i++) {
          const rubricItem = rubric[i];
          const createdRubricItem = await tx.rubricItem.create({
            data: {
              assignmentId: assignment.id,
              title: rubricItem.title,
              description: rubricItem.description || null,
              points: rubricItem.points,
              order: i
            }
          });

          // Create criteria levels if any
          if (rubricItem.criteriaLevels && rubricItem.criteriaLevels.length > 0) {
            await tx.criteriaLevel.createMany({
              data: rubricItem.criteriaLevels.map((level) => ({
                rubricItemId: createdRubricItem.id,
                level: level.level,
                description: level.description,
                points: level.points
              }))
            });
          }
        }
      }

      return await tx.assignment.findUnique({
        where: { id: assignment.id },
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
          }
        }
      });
    });

    // Ensure assignment was properly created
    if (!result || typeof result !== 'object') {
      throw new Error('Transaction did not return a valid assignment object');
    }

    // Log activity
    await logAssignmentActivity(userId.toString(), 'create_assignment', result.id, { title });

    // Revalidate paths
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);

    return NextResponse.json({
      data: result
    });
  } catch (error: any) {
    console.error('[ASSIGNMENT_CREATE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
