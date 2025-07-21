/* eslint-disable */

import { NextResponse } from 'next/server';

// POST /api/courses/[courseId]/duplicate - Duplicate a course
export async function POST() {
  try {
    // Return success response with mock duplicated course data
    return NextResponse.json({
      success: true,
      message: 'Course duplicated successfully',
      data: {
        id: 'course_' + Date.now(),
        title: 'Copy of Mock Course',
        slug: 'copy-of-mock-course',
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        instructor: {
          id: 'user_1',
          name: 'Mock Instructor',
          email: 'instructor@example.com',
          image: null
        },
        modules: [],
        students: 0,
        rating: 0,
        totalLessons: 0,
        totalDuration: 0
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating course:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to duplicate course',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
