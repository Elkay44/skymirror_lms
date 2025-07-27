import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for creating a version
const createVersionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  isAutosave: z.boolean().default(false),
});

// Schema for version query parameters
const versionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  includeAutosave: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
});

// Dynamic route to ensure data is not cached
export const dynamic = 'force-dynamic';

// GET /api/courses/[courseId]/versions - Get versions for a course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Check if user is instructor for this course or admin
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { 
        instructorId: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const isAdmin = session.user.role === 'ADMIN';
    const isInstructor = course.instructorId === userId;
    
    if (!isAdmin && !isInstructor) {
      return NextResponse.json(
        { error: 'Unauthorized to view versions' },
        { status: 403 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = versionQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      includeAutosave: searchParams.get('includeAutosave'),
    });
    
    // Get versions for this course
    const [versions, total] = await Promise.all([
      prisma.courseVersion.findMany({
        where: {
          courseId,
          isAutosave: query.includeAutosave ? undefined : false,
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.courseVersion.count({
        where: {
          courseId,
          isAutosave: query.includeAutosave ? undefined : false,
        },
      }),
    ]);
    
    return NextResponse.json({
      data: versions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/versions - Create a new version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Check if user is instructor for this course or admin
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        modules: {
          include: {
            lessons: true,
            quizzes: {
              include: {
                questions: {
                  include: {
                    options: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const isAdmin = session.user.role === 'ADMIN';
    const isInstructor = course.instructorId === userId;
    
    if (!isAdmin && !isInstructor) {
      return NextResponse.json(
        { error: 'Unauthorized to create versions' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { title, description, isAutosave } = createVersionSchema.parse(body);
    
    // Create a snapshot of the current course state
    const snapshot = {
      courseData: {
        ...course,
        modules: undefined,
      },
      modules: course.modules.map((module: any) => ({
        ...module,
        lessons: module.lessons,
        quizzes: module.quizzes.map((quiz: any) => ({
          ...quiz,
          questions: quiz.questions.map((question: any) => ({
            ...question,
            options: question.options,
          })),
        })),
      })),
    };
    
    // Create the version
    const version = await prisma.courseVersion.create({
      data: {
        courseId,
        title,
        description,
        snapshot: JSON.parse(JSON.stringify(snapshot)),
        isAutosave,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error('Error creating version:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
