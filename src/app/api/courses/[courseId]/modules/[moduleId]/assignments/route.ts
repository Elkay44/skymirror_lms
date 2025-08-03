import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a new assignment
const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string
  maxScore: z.number().min(0).optional(),
  submissionType: z.enum(['TEXT', 'FILE', 'LINK']).optional().default('TEXT'),
  isPublished: z.boolean().optional().default(false),
  allowLateSubmissions: z.boolean().optional().default(false),
  maxAttempts: z.number().int().min(1).optional(),
});

// GET /api/courses/[courseId]/modules/[moduleId]/assignments - Get all assignments for a module
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to view assignments' },
        { status: 401 }
      );
    }
    
    // Verify the module exists and belongs to the course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId: courseId
      },
      include: {
        course: {
          select: {
            id: true,
            instructorId: true,
            isPublished: true
          }
        }
      }
    });
    
    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access (instructor or enrolled student)
    const isInstructor = module.course.instructorId === userId;
    
    if (!isInstructor) {
      // Check if user is enrolled in the course
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: courseId,
          status: { in: ['ACTIVE', 'COMPLETED'] }
        }
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
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      data: assignments,
      total: assignments.length
    });
    
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/assignments - Create a new assignment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;
    const body = await request.json();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to create assignments' },
        { status: 401 }
      );
    }
    
    // Verify the course exists and user is the instructor
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: userId
      }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or you are not the instructor' },
        { status: 404 }
      );
    }
    
    // Verify the module exists and belongs to the course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId: courseId
      }
    });
    
    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }
    
    // Validate request body
    const validationResult = createAssignmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { title, description, instructions, dueDate, maxScore, submissionType, isPublished, allowLateSubmissions, maxAttempts } = validationResult.data;
    
    // Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        instructions,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore,
        submissionType,
        isPublished,
        allowLateSubmissions,
        maxAttempts,
        moduleId,
      }
    });
    
    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: userId,
          action: 'assignment_created',
          entityType: 'assignment',
          entityId: assignment.id,
          details: {
            assignmentTitle: assignment.title,
            moduleId: moduleId,
            courseId: courseId
          },
        },
      });
    } catch (error) {
      console.error('Failed to log assignment creation activity:', error);
      // Non-blocking - we don't fail the request if logging fails
    }
    
    return NextResponse.json({
      data: assignment,
      message: 'Assignment created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
