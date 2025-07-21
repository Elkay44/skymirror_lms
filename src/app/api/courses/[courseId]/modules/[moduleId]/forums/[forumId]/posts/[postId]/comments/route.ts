/* eslint-disable */

import { NextResponse } from 'next/server';

// GET /api/courses/[courseId]/modules/[moduleId]/forums/[forumId]/posts/[postId]/comments - Get comments for a forum post
export async function GET() {
  try {
    // Return mock comments data
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'comment_1',
          content: 'This is a sample comment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            id: 'user_1',
            name: 'John Doe',
            avatar: null,
            role: 'STUDENT'
          },
          likes: 5,
          isLiked: false,
          isAuthor: false
        },
        {
          id: 'comment_2',
          content: 'Another sample comment',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          author: {
            id: 'user_2',
            name: 'Instructor',
            avatar: null,
            role: 'INSTRUCTOR'
          },
          likes: 2,
          isLiked: true,
          isAuthor: false
        }
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch comments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/forums/[forumId]/posts/[postId]/comments - Create a new comment
export async function POST() {
  try {
    // Return success response with created comment data
    return NextResponse.json({
      success: true,
      message: 'Comment created successfully',
      data: {
        id: 'comment_' + Date.now(),
        content: 'New comment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 'current_user',
          name: 'Current User',
          avatar: null,
          role: 'STUDENT'
        },
        likes: 0,
        isLiked: false,
        isAuthor: true
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create comment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
