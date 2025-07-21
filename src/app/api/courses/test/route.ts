import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Simple query to test database connection
    const courses = await prisma.course.findMany({
      take: 10,
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
      },
    });

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
