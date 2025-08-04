import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple test response
    const response = {
      success: true,
      students: [],
      classAnalytics: {
        totalStudents: 0,
        averageGrade: 0,
        gradeDistribution: {
          'A': 0,
          'B': 0,
          'C': 0,
          'D': 0,
          'F': 0
        },
        assessmentCategories: [],
        topPerformers: [],
        strugglingStudents: []
      },
      courseInfo: {
        courseId: 'test',
        courseName: 'Test Course',
        totalEnrollments: 0,
        lastUpdated: new Date()
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in test API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test API failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
