/* eslint-disable */

import { NextResponse } from 'next/server';

// GET /api/courses/[courseId]/instructors - Get all instructors for a course
export async function GET() {
  try {
    // Return mock instructor data
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'instructor_1',
          name: 'John Doe',
          email: 'instructor@example.com',
          image: null,
          bio: 'Lead Instructor',
          isOwner: true,
          role: 'INSTRUCTOR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch instructors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/instructors - Add an instructor to a course
export async function POST() {
  try {
    // This endpoint is kept for backward compatibility but returns an error
    return NextResponse.json(
      { 
        success: false, 
        error: 'This operation is not supported. Each course can only have one instructor.' 
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error adding instructor:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add instructor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/instructors/[instructorId] - Update instructor role
export async function PATCH() {
  try {
    // This endpoint is kept for backward compatibility but returns an error
    return NextResponse.json(
      { 
        success: false, 
        error: 'This operation is not supported. Each course can only have one instructor.' 
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating instructor:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update instructor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/instructors/[instructorId] - Remove instructor from course
export async function DELETE() {
  try {
    // This endpoint is kept for backward compatibility but returns an error
    return NextResponse.json(
      { 
        success: false, 
        error: 'This operation is not supported. Cannot remove the only instructor from a course.' 
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error removing instructor:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove instructor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
