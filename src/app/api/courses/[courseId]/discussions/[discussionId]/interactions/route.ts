import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for discussion interactions
const interactionSchema = z.object({
  action: z.enum(['like', 'unlike', 'mark-solution', 'unmark-solution']),
  commentId: z.string().optional(), // Required for like/unlike comment and mark/unmark solution
});

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// POST /api/courses/[courseId]/discussions/[discussionId]/interactions
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; discussionId: string } }
) {
  try {
    const { courseId, discussionId } = params;
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    
    // Verify the discussion exists and belongs to the specified course
    const discussion = await prisma.discussionPost.findUnique({
      where: {
        id: discussionId,
        courseId,
      },
      include: {
        user: {
          select: { id: true }
        }
      }
    });
    
    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion not found or does not belong to this course' },
        { status: 404 }
      );
    }
    
    // Check if the user is enrolled in the course, is the instructor, or is an admin
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        instructorId: true,
        enrollments: {
          where: { userId }
        }
      }
    });
    
    const isInstructor = course?.instructorId === userId;
    const isEnrolled = course?.enrollments && course.enrollments.length > 0;
    const isDiscussionAuthor = discussion.user.id === userId;
    
    if (!isInstructor && !isEnrolled) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to interact with discussions' },
          { status: 403 }
        );
      }
    }
    
    // Parse and validate the request body
    const body = await req.json();
    const { action, commentId } = interactionSchema.parse(body);
    
    // Handle different interaction types
    switch (action) {
      case 'like':
        // Like the discussion or comment
        if (commentId) {
          // Verify the comment exists and belongs to the discussion
          const comment = await prisma.comment.findUnique({
            where: {
              id: commentId,
              discussionId,
            }
          });
          
          if (!comment) {
            return NextResponse.json(
              { error: 'Comment not found or does not belong to this discussion' },
              { status: 404 }
            );
          }
          
          // Check if the user has already liked this comment
          const existingCommentLike = await prisma.commentLike.findUnique({
            where: {
              userId_commentId: {
                userId,
                commentId
              }
            }
          });
          
          if (existingCommentLike) {
            return NextResponse.json(
              { error: 'You have already liked this comment' },
              { status: 400 }
            );
          }
          
          // Create the like
          await prisma.commentLike.create({
            data: {
              userId,
              commentId
            }
          });
          
          // Get updated like count
          const updatedCommentLikes = await prisma.commentLike.count({
            where: { commentId }
          });
          
          return NextResponse.json({
            message: 'Comment liked successfully',
            likeCount: updatedCommentLikes
          });
        } else {
          // Like the discussion
          // Check if the user has already liked this discussion
          const existingDiscussionLike = await prisma.discussionLike.findUnique({
            where: {
              userId_discussionId: {
                userId,
                discussionId
              }
            }
          });
          
          if (existingDiscussionLike) {
            return NextResponse.json(
              { error: 'You have already liked this discussion' },
              { status: 400 }
            );
          }
          
          // Create the like
          await prisma.discussionLike.create({
            data: {
              userId,
              discussionId
            }
          });
          
          // Get updated like count
          const updatedDiscussionLikes = await prisma.discussionLike.count({
            where: { discussionId }
          });
          
          return NextResponse.json({
            message: 'Discussion liked successfully',
            likeCount: updatedDiscussionLikes
          });
        }
      
      case 'unlike':
        // Unlike the discussion or comment
        if (commentId) {
          // Verify the comment exists and belongs to the discussion
          const comment = await prisma.comment.findUnique({
            where: {
              id: commentId,
              discussionId,
            }
          });
          
          if (!comment) {
            return NextResponse.json(
              { error: 'Comment not found or does not belong to this discussion' },
              { status: 404 }
            );
          }
          
          // Delete the like if it exists
          const deletedCommentLike = await prisma.commentLike.deleteMany({
            where: {
              userId,
              commentId
            }
          });
          
          if (deletedCommentLike.count === 0) {
            return NextResponse.json(
              { error: 'You have not liked this comment' },
              { status: 400 }
            );
          }
          
          // Get updated like count
          const updatedCommentLikes = await prisma.commentLike.count({
            where: { commentId }
          });
          
          return NextResponse.json({
            message: 'Comment unliked successfully',
            likeCount: updatedCommentLikes
          });
        } else {
          // Unlike the discussion
          // Delete the like if it exists
          const deletedDiscussionLike = await prisma.discussionLike.deleteMany({
            where: {
              userId,
              discussionId
            }
          });
          
          if (deletedDiscussionLike.count === 0) {
            return NextResponse.json(
              { error: 'You have not liked this discussion' },
              { status: 400 }
            );
          }
          
          // Get updated like count
          const updatedDiscussionLikes = await prisma.discussionLike.count({
            where: { discussionId }
          });
          
          return NextResponse.json({
            message: 'Discussion unliked successfully',
            likeCount: updatedDiscussionLikes
          });
        }
      
      case 'mark-solution':
        // Mark a comment as the solution to a question
        // This is only allowed if the discussion is a QUESTION type and the user is either
        // the discussion author, course instructor, or an admin
        
        if (!commentId) {
          return NextResponse.json(
            { error: 'Comment ID is required to mark as solution' },
            { status: 400 }
          );
        }
        
        // Verify the discussion is a question
        if (discussion.type !== 'QUESTION') {
          return NextResponse.json(
            { error: 'Only questions can have solution marked' },
            { status: 400 }
          );
        }
        
        // Check if user has permission to mark solution
        // Only discussion author, course instructor, or admin can mark a solution
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        
        const isAdmin = user?.role === 'ADMIN';
        
        if (!isDiscussionAuthor && !isInstructor && !isAdmin) {
          return NextResponse.json(
            { error: 'Only the question author, course instructor, or admin can mark a solution' },
            { status: 403 }
          );
        }
        
        // Verify the comment exists and belongs to the discussion
        const comment = await prisma.comment.findUnique({
          where: {
            id: commentId,
            discussionId,
          },
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        });
        
        if (!comment) {
          return NextResponse.json(
            { error: 'Comment not found or does not belong to this discussion' },
            { status: 404 }
          );
        }
        
        // Update the discussion to mark this comment as solution
        await prisma.discussionPost.update({
          where: { id: discussionId },
          data: {
            solutionCommentId: commentId,
            isAnswered: true
          }
        });
        
        // If the solution was marked by someone other than the comment author,
        // create a notification for the comment author
        if (comment.user.id !== userId) {
          await prisma.notification.create({
            data: {
              userId: comment.user.id,
              title: 'Your answer was marked as the solution',
              message: `Your answer to the question "${discussion.title}" was marked as the solution`,
              type: 'DISCUSSION',
              linkUrl: `/courses/${courseId}/discussions/${discussionId}#comment-${commentId}`
            }
          });
        }
        
        return NextResponse.json({
          message: 'Comment marked as solution successfully',
          solutionCommentId: commentId
        });
      
      case 'unmark-solution':
        // Unmark a comment as the solution
        // This is only allowed if the discussion is a QUESTION type and the user is either
        // the discussion author, course instructor, or an admin
        
        // Verify the discussion is a question
        if (discussion.type !== 'QUESTION') {
          return NextResponse.json(
            { error: 'Only questions can have solution unmarked' },
            { status: 400 }
          );
        }
        
        // Check if the discussion has a marked solution
        if (!discussion.solutionCommentId) {
          return NextResponse.json(
            { error: 'This question does not have a marked solution' },
            { status: 400 }
          );
        }
        
        // Check if user has permission to unmark solution
        // Only discussion author, course instructor, or admin can unmark a solution
        const userForUnmark = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        
        const isAdminForUnmark = userForUnmark?.role === 'ADMIN';
        
        if (!isDiscussionAuthor && !isInstructor && !isAdminForUnmark) {
          return NextResponse.json(
            { error: 'Only the question author, course instructor, or admin can unmark a solution' },
            { status: 403 }
          );
        }
        
        // Update the discussion to unmark the solution
        await prisma.discussionPost.update({
          where: { id: discussionId },
          data: {
            solutionCommentId: null,
            isAnswered: false
          }
        });
        
        return NextResponse.json({
          message: 'Solution unmarked successfully'
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[DISCUSSION_INTERACTION_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process interaction' },
      { status: 500 }
    );
  }
}
