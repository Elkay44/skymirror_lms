import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET endpoint to fetch forums for a course
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = params;

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is enrolled in the course or is the instructor
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, title: true },
    });

    if (!enrollment && course?.instructorId !== user.id) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to access forums' },
        { status: 403 }
      );
    }

    // Get forums for this course
    const forums = await prisma.forum.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        description: true,
        courseId: true,
        isGlobal: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { posts: true },
        },
        posts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
            author: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format the response
    const formattedForums = forums.map((forum) => ({
      id: forum.id,
      title: forum.title,
      description: forum.description,
      courseId: forum.courseId,
      isGlobal: forum.isGlobal,
      postsCount: forum._count.posts,
      lastPostAt: forum.posts[0]?.createdAt || null,
      lastPostAuthor: forum.posts[0]?.author.name || null,
    }));

    return NextResponse.json({
      forums: formattedForums,
      courseName: course?.title,
    });
  } catch (error) {
    console.error('Error fetching forums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forums' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new forum
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = params;
    const { title, description } = await req.json();

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Only instructors or admins can create forums
    const isInstructor = course.instructorId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'Only instructors or admins can create forums' },
        { status: 403 }
      );
    }

    // Create new forum
    const newForum = await prisma.forum.create({
      data: {
        title,
        description,
        courseId,
        createdById: user.id,
      },
    });

    return NextResponse.json({
      id: newForum.id,
      title: newForum.title,
      description: newForum.description,
      courseId: newForum.courseId,
      isGlobal: newForum.isGlobal,
      postsCount: 0,
      lastPostAt: null,
      lastPostAuthor: null,
    });
  } catch (error) {
    console.error('Error creating forum:', error);
    return NextResponse.json(
      { error: 'Failed to create forum' },
      { status: 500 }
    );
  }
}
