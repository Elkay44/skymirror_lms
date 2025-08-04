import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  
  try {
    // Simple response without database queries
    return NextResponse.json({
      students: [],
      classAverage: 0,
      totalStudents: 0,
      message: 'Simplified marks API working',
      courseId
    });
  } catch (error) {
    console.error('Error in simplified marks API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marks data' },
      { status: 500 }
    );
  }
}
