/* eslint-disable */

import { NextResponse } from 'next/server';

// GET /api/courses/[courseId]/modules/[moduleId]/assignments - Get all assignments for a module
export async function GET() {
  try {
    // Return mock assignments data
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'assignment_1',
          title: 'Sample Assignment 1',
          description: 'First sample assignment',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxScore: 100,
          submissionType: 'TEXT',
          isPublished: true,
          submissionStatus: 'NOT_SUBMITTED',
          dueInDays: 7
        },
        {
          id: 'assignment_2',
          title: 'Sample Assignment 2',
          description: 'Second sample assignment',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          maxScore: 50,
          submissionType: 'FILE',
          isPublished: true,
          submissionStatus: 'SUBMITTED',
          dueInDays: 14
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/assignments - Create a new assignment
export async function POST() {
  try {
    // Return success response with created assignment data
    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      data: {
        id: 'assignment_' + Date.now(),
        title: 'New Assignment',
        description: 'Assignment description',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
        submissionType: 'TEXT',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
