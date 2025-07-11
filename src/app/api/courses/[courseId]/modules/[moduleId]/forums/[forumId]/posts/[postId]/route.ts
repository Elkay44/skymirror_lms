import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/courses/[courseId]/modules/[moduleId]/forums/[forumId]/posts/[postId]
export async function GET(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; forumId: string; postId: string } }
) {
  try {
    const { courseId, moduleId, forumId, postId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access this resource.' },
        { status: 401 }
      );
    }

    // Get the course to check if it exists and access permissions
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        isPublished: true,
        instructorId: true,
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if user is enrolled or is the instructor or an admin
    const isInstructor = course.instructorId === Number(userId);
    const isAdmin = session?.user?.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: Number(userId),
          courseId,
          status: { in: ['ACTIVE', 'COMPLETED'] }
        }
      });

      // If the course is not published and the user is not enrolled, deny access
      if (!course.isPublished && !enrollment) {
        return NextResponse.json(
          { error: 'Course is not published. You must be enrolled to access its content.' },
          { status: 403 }
        );
      }

      // If user is not enrolled, deny access
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to access its content.' },
          { status: 403 }
        );
      }
    }

    // Fetch the post with author and counts
    const post = await prisma.forumPost.findFirst({
      where: { 
        id: postId,
        forumId: forumId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count asynchronously (don't wait for completion)
    prisma.forumPost.update({
      where: { id: postId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    }).catch(error => {
      console.error('Error incrementing view count:', error);
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/modules/[moduleId]/forums/[forumId]/posts/[postId]
export async function PATCH(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; forumId: string; postId: string } }
) {
  try {
    const { courseId, moduleId, forumId, postId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the post to check ownership and permissions
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Get the forum and module to check permissions
    const forum = await prisma.forum.findUnique({
      where: { id: post.forumId }
    });
    
    if (!forum || forum.id !== forumId) {
      return NextResponse.json({ error: 'Forum not found or mismatch' }, { status: 404 });
    }
    
    // Get module and course info
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            instructorId: true
          }
        }
      }
    });
    
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    
    const isPostAuthor = post.author?.id.toString() === userId;
    const isInstructor = module.course.instructorId.toString() === userId;
    const isAdmin = session.user.role === 'ADMIN';

    // Only post author, course instructor, or admin can modify posts
    if (!isPostAuthor && !isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this post' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    const postSchema = z.object({
      title: z.string().min(3).max(255).optional(),
      content: z.string().min(10).optional(),
      isPinned: z.boolean().optional(),
      isLocked: z.boolean().optional()
    });

    const validation = postSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid post data', issues: validation.error.issues },
        { status: 400 }
      );
    }

    const { title, content, isPinned, isLocked } = validation.data;

    // Only instructors and admins can pin or lock posts
    if ((isPinned !== undefined || isLocked !== undefined) && !isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'Only instructors and admins can pin or lock posts' },
        { status: 403 }
      );
    }

    // Update post
    const updatedPost = await prisma.forumPost.update({
      where: { id: postId },
      data: {
        title,
        content,
        isPinned,
        isLocked
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/modules/[moduleId]/forums/[forumId]/posts/[postId]
export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; forumId: string; postId: string } }
) {
  try {
    const { courseId, moduleId, forumId, postId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the post to check ownership and permissions
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Get the forum and module to check permissions
    const forum = await prisma.forum.findUnique({
      where: { id: post.forumId }
    });
    
    if (!forum || forum.id !== forumId) {
      return NextResponse.json({ error: 'Forum not found or mismatch' }, { status: 404 });
    }
    
    // Get module and course info
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            instructorId: true
          }
        }
      }
    });
    
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    
    const isPostAuthor = post.author?.id.toString() === userId;
    const isInstructor = module.course.instructorId.toString() === userId;
    const isAdmin = session.user.role === 'ADMIN';

    // Only post author, course instructor, or admin can delete posts
    if (!isPostAuthor && !isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this post' },
        { status: 403 }
      );
    }

    // Delete post (this will cascade delete all comments)
    await prisma.forumPost.delete({
      where: { id: postId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
