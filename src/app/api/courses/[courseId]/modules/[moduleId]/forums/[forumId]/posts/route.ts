/* eslint-disable */

import { NextResponse } from 'next/server';

// GET /api/courses/[courseId]/modules/[moduleId]/forums/[forumId]/posts - Get forum posts
export async function GET() {
  try {
    // Return mock forum posts data
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'post_1',
          title: 'Welcome to the Forum',
          content: 'This is the first post in this forum.',
          isPinned: true,
          isLocked: false,
          viewCount: 150,
          replyCount: 8,
          lastReplyAt: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          author: {
            id: 'user_1',
            name: 'Instructor',
            avatar: null,
            role: 'INSTRUCTOR'
          },
          tags: ['announcement', 'welcome']
        },
        {
          id: 'post_2',
          title: 'Question about the first assignment',
          content: 'I have a question about the requirements for the first assignment.',
          isPinned: false,
          isLocked: false,
          viewCount: 75,
          replyCount: 3,
          lastReplyAt: new Date(Date.now() - 7200000).toISOString(),
          createdAt: new Date(Date.now() - 43200000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
          author: {
            id: 'user_2',
            name: 'Student',
            avatar: null,
            role: 'STUDENT'
          },
          tags: ['question', 'assignment']
        }
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      },
      forum: {
        id: 'forum_1',
        name: 'General Discussion',
        description: 'Discuss course-related topics',
        isLocked: false,
        canPost: true
      },
      module: {
        id: 'module_1',
        title: 'Introduction',
        isPublished: true
      },
      course: {
        id: 'course_1',
        title: 'Sample Course',
        isPublished: true
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

// POST /api/courses/[courseId]/modules/[moduleId]/forums/[forumId]/posts - Create a new forum post
export async function POST() {
  try {
    // Return success response with created post data
    return NextResponse.json({
      success: true,
      message: 'Forum post created successfully',
      data: {
        id: 'post_' + Date.now(),
        title: 'New Forum Post',
        content: 'This is a new forum post.',
        isPinned: false,
        isLocked: false,
        viewCount: 0,
        replyCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 'current_user',
          name: 'Current User',
          avatar: null,
          role: 'STUDENT'
        },
        tags: []
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
