import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Schema for creating a new assignment
const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string
  points: z.number().int().min(0).default(100),
  type: z.enum(['TEXT', 'FILE', 'LINK']).optional().default('TEXT'),
  isPublished: z.boolean().optional().default(false),
  rubricId: z.string().optional().nullable(),
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
    
    // Define the assignment type with submissions
    type AssignmentWithSubmissions = {
      id: string;
      title: string;
      description: string | null;
      content: string | null;
      dueDate: Date | null;
      points: number;
      type: string;
      isPublished: boolean;
      rubricId: string | null;
      moduleId: string;
      createdAt: Date;
      updatedAt: Date;
      _count: { submissions: number };
      submissions: Array<{ grade: number | null; status: string }>;
      rubric: { id: string; name: string } | null;
    };

    // Get assignments for this module with submission counts and grading stats
    const assignments = await prisma.assignment.findMany({
      where: { moduleId },
      include: {
        _count: {
          select: {
            submissions: true
          }
        },
        submissions: {
          select: {
            grade: true,
            status: true
          }
        },
        rubric: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }) as unknown as AssignmentWithSubmissions[];

    // Calculate grading statistics for each assignment
    const assignmentsWithStats = assignments.map(assignment => {
      const submissions = assignment.submissions as Array<{ grade: number | null; status: string }>;
      const gradedSubmissions = submissions.filter(s => s.status === 'GRADED' && s.grade !== null);
      const averageGrade = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum: number, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
        : null;

      // Create a new object without the submissions array
      const { submissions: _, ...assignmentWithoutSubmissions } = assignment as any;
      
      return {
        ...assignmentWithoutSubmissions,
        averageGrade: averageGrade ? Math.round(averageGrade * 10) / 10 : null,
        submissionCount: (assignment as any)._count.submissions,
        gradedCount: gradedSubmissions.length
      };
    });
    
    return NextResponse.json({
      data: assignmentsWithStats,
      total: assignmentsWithStats.length
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

    console.log('Received request body:', body);
    console.log('Course ID:', courseId);
    console.log('Module ID:', moduleId);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      console.log('No user ID in session');
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
      console.log('Course not found or user is not instructor');
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
      console.log('Module not found');
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }
    
    // Validate request body
    console.log('Validating request body...');
    const validationResult = createAssignmentSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors);
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: errors 
        },
        { status: 400 }
      );
    }

    console.log('Validation successful');
    const { title, description, content, dueDate, points, type, isPublished, rubricId } = validationResult.data;
    
    // Create the assignment within a transaction
    try {
      console.log('Attempting to create assignment...');
      const [assignment] = await Promise.all([
        prisma.assignment.create({
          data: {
            title,
            description,
            content,
            dueDate: dueDate ? new Date(dueDate) : null,
            points: points || 100,
            type,
            isPublished,
            rubricId: rubricId || null,
            moduleId,
          },
          include: {
            module: {
              select: {
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                    instructorId: true
                  }
                }
              }
            }
          }
        }),
        // Update module's updatedAt timestamp
        prisma.module.update({
          where: { id: moduleId },
          data: { updatedAt: new Date() }
        })
      ]);

      console.log('Assignment created successfully:', assignment);

      // Log activity (non-blocking)
      prisma.activityLog.create({
        data: {
          userId: userId,
          action: 'assignment_created',
          entityType: 'assignment',
          entityId: assignment.id,
          details: {
            assignmentTitle: assignment.title,
            moduleId: moduleId,
            moduleTitle: assignment.module?.title,
            courseId: courseId,
            courseTitle: assignment.module?.course?.title
          },
        },
      }).catch(error => {
        console.error('Failed to log assignment creation activity:', error);
      });

      return NextResponse.json({
        data: assignment,
        message: 'Assignment created successfully'
      }, { status: 201 });

    } catch (error) {
      console.error('Error in assignment transaction:', error);
      throw error; // Let the outer catch handle this
    }
  } catch (error: unknown) {
    console.error('Error creating assignment:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to create assignment', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create assignment', details: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
