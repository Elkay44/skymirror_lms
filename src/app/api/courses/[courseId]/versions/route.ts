import { NextRequest, NextResponse } from 'next/server';
import prismaBase from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { extendPrismaClient } from '@/lib/prisma-extensions';

// Extend the prisma client with our custom extensions
const prisma = extendPrismaClient(prismaBase);

// Schema for creating a version
const createVersionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  isAutosave: z.boolean().default(false),
});

// Schema for restoring a version
const restoreVersionSchema = z.object({
  versionId: z.string(),
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
        { error: 'You are not authorized to view versions for this course' },
        { status: 403 }
      );
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, includeAutosave } = versionQuerySchema.parse(searchParams);
    
    // Calculate pagination offsets
    const skip = (page - 1) * limit;
    
    // Build where clause for SQL queries
    const whereClause: any = { courseId };
    if (!includeAutosave) {
      whereClause.isAutosave = false;
    }
    
    // We'll use the standard Prisma client for querying since our extension might
    // not correctly handle complex queries
    
    // Get total count using prismaBase instead of the extended client
    const totalCount = await prismaBase.courseVersion.count({
      where: whereClause
    });
    
    // Get versions with pagination
    const versions = await prismaBase.courseVersion.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    
    // Get createdBy users for each version
    const createdByIds = versions
      .map(v => v.createdById)
      .filter((id): id is number => id !== null && id !== undefined);
    
    const creators = createdByIds.length > 0 
      ? await prismaBase.user.findMany({
          where: { id: { in: createdByIds } },
          select: { id: true, name: true, image: true }
        })
      : [];
      
    // Merge version data with creators and parse JSON data
    const versionsWithCreators = versions.map(version => {
      // Parse snapshot if it's stored as a string
      let parsedSnapshot = version.snapshot;
      try {
        if (typeof version.snapshot === 'string') {
          parsedSnapshot = JSON.parse(version.snapshot as string);
        }
      } catch (e) {
        console.error('Error parsing version snapshot', e);
      }
      
      return {
        ...version,
        snapshot: parsedSnapshot,
        createdBy: creators.find(c => c.id === version.createdById) || null
      };
    });
    
    return NextResponse.json({
      versions: versionsWithCreators,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    });
  } catch (error) {
    console.error('[GET_COURSE_VERSIONS_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch course versions' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/versions - Create a new version
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
      select: {
        instructorId: true,
        title: true,
        description: true,
        shortDescription: true,
        imageUrl: true,
        price: true,
        isPublished: true,
        // Field 'category' doesn't exist in Course model
        // Using difficulty field instead
        language: true,
        // level field doesn't exist in CourseSelect
        difficulty: true,
        requirements: true,
        learningOutcomes: true,
        targetAudience: true,
      }
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
        { error: 'You are not authorized to create versions for this course' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const { title, description, isAutosave } = createVersionSchema.parse(body);
    
    // Get all modules for the course with their lessons and quizzes
    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          // Content is a direct field on Lesson, not a relation to include
          // Since we're having type issues with select, let's use a type assertion instead
          include: {} as any
        },
        quizzes: {
          include: {
            questions: {
              orderBy: { position: 'asc' },
              include: {
                options: {
                  orderBy: { position: 'asc' }
                }
              }
            }
          }
        }
      }
    });
    
    // Create the snapshot data
    const snapshot = {
      courseData: {
        ...course,
        requirements: course.requirements ? JSON.parse(course.requirements as string) : [],
        learningOutcomes: course.learningOutcomes ? JSON.parse(course.learningOutcomes as string) : [],
        targetAudience: course.targetAudience ? JSON.parse(course.targetAudience as string) : [],
      },
      modules: modules.map((module: any) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        position: module.position,
        isPublished: module.isPublished,
        lessons: module.lessons.map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          position: lesson.position,
          isPublished: lesson.isPublished,
          isFree: lesson.isFree,
          content: lesson.content ? {
            text: lesson.content.text,
            videoUrl: lesson.content.videoUrl,
            attachments: lesson.content.attachments ? JSON.parse(lesson.content.attachments) : [],
            resources: lesson.content.resources ? JSON.parse(lesson.content.resources) : [],
          } : null
        })),
        quizzes: module.quizzes.map((quiz: any) => ({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          position: quiz.position,
          isPublished: quiz.isPublished,
          timeLimit: quiz.timeLimit,
          passingScore: quiz.passingScore,
          questions: quiz.questions.map((question: any) => ({
            id: question.id,
            text: question.text,
            type: question.type,
            position: question.position,
            points: question.points,
            explanation: question.explanation,
            options: question.options.map((option: any) => ({
              id: option.id,
              text: option.text,
              isCorrect: option.isCorrect,
              position: option.position
            }))
          }))
        }))
      }))
    };
    
    // Create the version
    const version = await prisma.courseVersion.create({
      data: {
        courseId,
        title,
        description,
        isAutosave,
        createdById: userId,
        snapshot: snapshot  // Our extension will handle JSON.stringify
      }
    });
    
    // Get creator information
    const creator = await prismaBase.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true }
    });
    
    // If this is autosave, limit the number of autosave versions to 5
    if (isAutosave) {
      const autosaveVersions = await prisma.courseVersion.findMany({
        where: {
          courseId,
          isAutosave: true
        },
        orderBy: { createdAt: 'desc' },
        take: 6 // Get one more than we want to keep
      });
      
      // Delete oldest autosave if we have more than 5
      if (autosaveVersions.length > 5 && autosaveVersions[5]?.id) {
        await prisma.courseVersion.delete({
          where: { id: autosaveVersions[5].id }
        });
      }
    }
    
    return NextResponse.json({
      message: isAutosave ? 'Course autosaved successfully' : 'Course version created successfully',
      version: {
        id: version.id,
        title: version.title,
        description: version.description,
        isAutosave: version.isAutosave,
        createdAt: version.createdAt,
        createdBy: creator
      }
    });
  } catch (error) {
    console.error('[CREATE_COURSE_VERSION_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create course version' },
      { status: 500 }
    );
  }
}
