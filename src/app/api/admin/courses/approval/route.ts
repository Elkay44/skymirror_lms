/* eslint-disable */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Ensure the route is always dynamically rendered
export const dynamic = 'force-dynamic';

// GET /api/admin/courses/approval - Get courses pending approval
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // In a real implementation, this would fetch courses pending approval
    // For now, return an empty array since we don't have a Course model
    const pendingCourses: any[] = [];
    
    return NextResponse.json({
      success: true,
      data: {
        courses: pendingCourses,
        count: pendingCourses.length
      }
    });
  } catch (error) {
    console.error('Error fetching courses for approval:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch courses for approval' 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/courses/approval - Process a course approval action
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { courseId, action, feedback } = body;

    if (!courseId || !action) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: courseId and action are required' 
        },
        { status: 400 }
      );
    }

    // In a real implementation, this would update the course status
    // For now, just return a success response
    
    return NextResponse.json({
      success: true,
      message: `Course ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: {
        courseId,
        action,
        feedback
      }
    });
  } catch (error) {
    console.error('Error processing course approval:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process course approval' 
      },
      { status: 500 }
    );
  }
}
