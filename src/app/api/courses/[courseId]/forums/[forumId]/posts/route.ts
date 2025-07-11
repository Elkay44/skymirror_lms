import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST endpoint to create a new forum post
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; forumId: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, forumId } = params;
    const { title, content } = await req.json();

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, image: true },
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
      select: { instructorId: true },
    });

    if (!enrollment && course?.instructorId !== user.id) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to create posts' },
        { status: 403 }
      );
    }

    // Check if forum exists and belongs to the course
    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
      select: { id: true, courseId: true, isLocked: true },
    });

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 });
    }

    if (forum.courseId !== courseId) {
      return NextResponse.json(
        { error: 'Forum does not belong to this course' },
        { status: 400 }
      );
    }

    if (forum.isLocked) {
      return NextResponse.json(
        { error: 'This forum is locked and cannot receive new posts' },
        { status: 403 }
      );
    }

    // Create new post
    const newPost = await prisma.forumPost.create({
      data: {
        title,
        content,
        authorId: user.id,
        forumId,
      },
    });

    // Create notification for course instructor
    if (course && course.instructorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: course.instructorId,
          title: 'New Forum Post',
          message: `${user.name || 'A student'} posted in your course forum: "${title}".`,
          type: 'FORUM',
          linkUrl: `/courses/${courseId}/forums/${forumId}/posts/${newPost.id}`,
        }
      });
    }

    // Format the response
    const formattedPost = {
      id: newPost.id,
      title: newPost.title,
      content: newPost.content,
      authorId: user.id,
      authorName: user.name || 'Anonymous',
      authorImage: user.image,
      createdAt: newPost.createdAt.toISOString(),
      updatedAt: newPost.updatedAt.toISOString(),
      isPinned: newPost.isPinned,
      isLocked: newPost.isLocked,
      viewCount: 0,
      likes: 0,
      comments: [],
    };

    return NextResponse.json(formattedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
