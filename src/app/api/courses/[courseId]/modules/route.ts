import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Module } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to view course modules' },
        { status: 401 }
      );
    }

    // Check if the course exists and if the user has access
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { id: true }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if the user is the instructor
    // Convert both IDs to strings for comparison
    const isInstructor = course.instructor.id.toString() === userId.toString();

    // If not the instructor and course is not published, return 404
    if (!isInstructor && !course.isPublished) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Fetch all modules for the course with lessons
    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },  // Order by the 'order' field defined in the schema
      include: {
        lessons: {
          orderBy: { order: 'asc' },  // Order by the 'order' field defined in the schema
          include: {
            progress: {
              where: {
                userId: isInstructor ? undefined : userId ? Number(userId) : undefined
              },
              select: {
                completed: true,
                completedAt: true,
              },
            },
          },
        },
      },
    });

    // Map order to order for client-side compatibility
    const modulesWithOrder = modules.map(module => ({
      ...module,
      lessons: module.lessons?.map(lesson => ({
        ...lesson,
        order: lesson.order
      }))
    }));
    
    return NextResponse.json({ 
      data: modulesWithOrder,
      total: modulesWithOrder.length 
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId, instructorId: Number(userId) },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found or you are not the instructor' }, { status: 404 });
    }

    const { title, description, status, learningObjectives, estimatedDuration, prerequisites } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Find the last module to determine the new order.
    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    const highestOrder = lastModule ? lastModule.order : -1;

    // Create the new module with order field
    const newModule = await prisma.module.create({
      data: {
        title,
        description: description || '',
        courseId,
        order: highestOrder + 1,
      },
    });

    // Transform the module to match client expectations
    const responseModule = {
      id: newModule.id,
      title: newModule.title,
      description: newModule.description,
      courseId: newModule.courseId,
      order: newModule.order, 
      createdAt: newModule.createdAt,
      updatedAt: newModule.updatedAt,
      // Add client-expected fields that don't exist in the database
      status: 'draft',
      estimatedDuration: 0,
      duration: 0,
      isPublished: false,
      learningObjectives: [],
      prerequisites: [],
    };
    
    return NextResponse.json(responseModule, { status: 201 });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    );
  }
}
