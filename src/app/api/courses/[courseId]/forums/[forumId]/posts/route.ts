/* eslint-disable */

import { NextResponse } from 'next/server';

// POST /api/courses/[courseId]/forums/[forumId]/posts - Create a new forum post
export async function POST() {
  try {
    // Return success response with mock post data
    return NextResponse.json({
      success: true,
      message: 'Forum post created successfully',
      data: {
        id: 'post_' + Date.now(),
        title: 'Mock Forum Post',
        content: 'This is a mock forum post',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 'user_1',
          name: 'Mock User',
          email: 'user@example.com'
        },
        likes: 0,
        comments: 0,
        isPinned: false,
        isLocked: false
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create forum post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/courses/[courseId]/forums/[forumId]/posts - Get forum posts
export async function GET() {
  try {
    // Return mock posts data
    return NextResponse.json({
      success: true,
      data: {
        posts: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch forum posts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
