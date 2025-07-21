/* eslint-disable */

import { NextResponse } from 'next/server';

// GET /api/courses/[courseId]/discussions/[discussionId]/comments - Get comments for a discussion
export async function GET() {
  try {
    // Return mock comments data
    return NextResponse.json({
      success: true,
      data: {
        comments: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching discussion comments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch discussion comments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/discussions/[discussionId]/comments - Create a comment
export async function POST() {
  try {
    // Return success response with mock comment data
    return NextResponse.json({
      success: true,
      message: 'Comment created successfully',
      data: {
        id: 'comment_' + Date.now(),
        content: 'Mock comment content',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 'user_1',
          name: 'Mock User',
          image: null
        },
        likes: 0,
        isLiked: false
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
