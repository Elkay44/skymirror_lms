import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-extensions';

// GET - Fetch mentor career paths
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    // Build where clause for filtering
    const whereClause: any = {
      createdBy: user.id
    };

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    // Fetch career paths from database
    const careerPaths = await prisma.careerPath.findMany({
      where: whereClause,
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.careerPath.count({
      where: whereClause
    });

    // Transform data to match frontend expectations
    const transformedPaths = careerPaths.map((path: any) => {
      const totalEnrollments = path.enrollments.length;
      const completedEnrollments = path.enrollments.filter((e: any) => e.status === 'COMPLETED').length;
      const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

      // Parse tags from comma-separated string
      const tagsArray = path.tags ? path.tags.split(',').map((tag: string) => tag.trim()) : [];

      return {
        id: path.id,
        title: path.title,
        description: path.description,
        category: path.category,
        difficulty: path.difficulty,
        estimatedDuration: path.estimatedDuration,
        milestones: path.milestones.map((milestone: any) => ({
          id: milestone.id,
          title: milestone.title,
          description: milestone.description,
          completed: milestone.isCompleted,
          order: milestone.order
        })),
        menteeCount: totalEnrollments,
        completionRate,
        tags: tagsArray,
        isPublished: path.isPublished,
        createdAt: path.createdAt.toISOString(),
        updatedAt: path.updatedAt.toISOString()
      };
    });

    // Calculate summary statistics
    const allPaths = await prisma.careerPath.findMany({
      where: { createdBy: user.id },
      include: {
        enrollments: true
      }
    });

    const summary = {
      totalPaths: allPaths.length,
      categories: {
        development: allPaths.filter((p: any) => p.category === 'DEVELOPMENT').length,
        career: allPaths.filter((p: any) => p.category === 'CAREER').length,
        dataScience: allPaths.filter((p: any) => p.category === 'DATA_SCIENCE').length
      },
      averageCompletionRate: allPaths.length > 0 ? Math.round(
        allPaths.reduce((sum: number, path: any) => {
          const totalEnrollments = path.enrollments.length;
          const completedEnrollments = path.enrollments.filter((e: any) => e.status === 'COMPLETED').length;
          return sum + (totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0);
        }, 0) / allPaths.length
      ) : 0,
      totalMentees: allPaths.reduce((sum: number, path: any) => sum + path.enrollments.length, 0)
    };

    return NextResponse.json({
      careerPaths: transformedPaths,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary
    });
  } catch (error) {
    console.error('Error fetching mentor career paths:', error);
    return NextResponse.json(
      { error: 'Failed to fetch career paths' },
      { status: 500 }
    );
  }
}

// POST - Create a new career path
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, difficulty, estimatedDuration, tags, milestones } = body;

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category' },
        { status: 400 }
      );
    }

    // Convert tags array to comma-separated string
    const tagsString = Array.isArray(tags) ? tags.join(', ') : '';

    // Create career path with milestones
    const careerPath = await prisma.careerPath.create({
      data: {
        title,
        description,
        category,
        difficulty: difficulty || 'BEGINNER',
        estimatedDuration,
        tags: tagsString,
        createdBy: user.id,
        milestones: {
          create: milestones?.map((milestone: any, index: number) => ({
            title: milestone.title,
            description: milestone.description,
            order: index + 1
          })) || []
        }
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Transform response to match frontend expectations
    const response = {
      id: careerPath.id,
      title: careerPath.title,
      description: careerPath.description,
      category: careerPath.category,
      difficulty: careerPath.difficulty,
      estimatedDuration: careerPath.estimatedDuration,
      tags: careerPath.tags ? careerPath.tags.split(',').map((tag: string) => tag.trim()) : [],
      isPublished: careerPath.isPublished,
      milestones: careerPath.milestones?.map((milestone: any) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        completed: milestone.isCompleted,
        order: milestone.order
      })),
      menteeCount: 0,
      completionRate: 0,
      createdAt: careerPath.createdAt.toISOString(),
      updatedAt: careerPath.updatedAt.toISOString()
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating career path:', error);
    return NextResponse.json(
      { error: 'Failed to create career path' },
      { status: 500 }
    );
  }
}
