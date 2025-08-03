/* eslint-disable */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Validation schema for instructor query parameters
const instructorQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  search: z.string().optional(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// GET /api/admin/instructors - Get all instructors with basic filtering and pagination
export async function GET(req: Request) {
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

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = instructorQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const { page, limit, search, status, sortBy, sortOrder } = validation.data;
    const skip = (page - 1) * limit;

    // Build the where clause
    const whereClause: any = {
      role: 'INSTRUCTOR' // Only get instructors
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    // Get total count of matching instructors for pagination
    const totalCount = await prisma.user.count({ where: whereClause });

    // Get paginated instructors
    const instructors = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // In a real implementation, you might include related data here
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    });
    
    return NextResponse.json({
      success: true,
      data: {
        instructors,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
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

// POST /api/admin/instructors - Register a new instructor
export async function POST(req: Request) {
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

    // Parse and validate request body
    const body = await req.json();
    
    // In a real implementation, you would validate the request body
    // and create a new instructor in the database
    
    // For now, just return a success response with mock data
    return NextResponse.json({
      success: true,
      message: 'Instructor created successfully',
      data: {
        id: 'new-instructor-id',
        name: body.name || 'New Instructor',
        email: body.email || 'instructor@example.com',
        role: 'INSTRUCTOR',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating instructor:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create instructor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/instructors - Update instructor status or permissions
export async function PATCH(req: Request) {
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

    // Parse and validate request body
    const body = await req.json();
    const { instructorId, status } = body;

    if (!instructorId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Instructor ID is required' 
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would update the instructor in the database
    // For now, just return a success response with mock data
    
    return NextResponse.json({
      success: true,
      message: 'Instructor updated successfully',
      data: {
        id: instructorId,
        status: status || 'active',
        updatedAt: new Date().toISOString()
      }
    });
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
