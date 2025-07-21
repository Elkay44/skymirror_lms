/* eslint-disable */

import { NextResponse } from 'next/server';

// GET /api/courses/[courseId]/modules/[moduleId]/lessons - Get all lessons for a module
export async function GET() {
  try {
    // Return mock lessons data
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'lesson_1',
          title: 'Introduction to the Course',
          description: 'Welcome to the course! This is an introductory lesson.',
          duration: 15, // minutes
          order: 1,
          isPublished: true,
          isPreview: true,
          completionStatus: 'COMPLETED',
          nextLesson: 'lesson_2'
        },
        {
          id: 'lesson_2',
          title: 'Getting Started',
          description: 'Learn how to get started with the course materials.',
          duration: 20,
          order: 2,
          isPublished: true,
          isPreview: false,
          completionStatus: 'IN_PROGRESS',
          previousLesson: 'lesson_1',
          nextLesson: 'lesson_3'
        },
        {
          id: 'lesson_3',
          title: 'Advanced Topics',
          description: 'Dive deeper into advanced concepts.',
          duration: 30,
          order: 3,
          isPublished: false,
          isPreview: false,
          completionStatus: 'NOT_STARTED',
          previousLesson: 'lesson_2'
        }
      ],
      module: {
        id: 'module_1',
        title: 'Introduction',
        isPublished: true,
        courseId: 'course_1'
      },
      canEdit: true
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch lessons',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/lessons - Create a new lesson
export async function POST() {
  try {
    // Return success response with created lesson data
    return NextResponse.json({
      success: true,
      message: 'Lesson created successfully',
      data: {
        id: 'lesson_' + Date.now(),
        title: 'New Lesson',
        description: 'New lesson description',
        duration: 0,
        order: 1,
        isPublished: false,
        isPreview: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create lesson',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
