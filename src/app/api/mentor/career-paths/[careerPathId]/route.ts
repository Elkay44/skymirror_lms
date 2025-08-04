import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-extensions';

// GET - Fetch individual career path
export async function GET(
  _request: Request,
  context: { params: Promise<{ careerPathId: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { careerPathId } = params;

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    // Fetch career path
    const careerPath = await (prisma as any).careerPath.findUnique({
      where: { 
        id: careerPathId,
        createdBy: user.id // Ensure user owns this career path
      },
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
        }
      }
    });

    if (!careerPath) {
      return NextResponse.json({ error: 'Career path not found' }, { status: 404 });
    }

    // Transform data to match frontend expectations
    const totalEnrollments = careerPath.enrollments.length;
    const completedEnrollments = careerPath.enrollments.filter((e: any) => e.status === 'COMPLETED').length;
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    const response = {
      id: careerPath.id,
      title: careerPath.title,
      description: careerPath.description,
      category: careerPath.category,
      difficulty: careerPath.difficulty,
      estimatedDuration: careerPath.estimatedDuration,
      tags: careerPath.tags ? careerPath.tags.split(',').map((tag: string) => tag.trim()) : [],
      isPublished: careerPath.isPublished,
      milestones: careerPath.milestones.map((milestone: any) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        completed: milestone.isCompleted,
        order: milestone.order
      })),
      menteeCount: totalEnrollments,
      completionRate,
      enrollments: careerPath.enrollments.map((enrollment: any) => ({
        id: enrollment.id,
        user: enrollment.user,
        status: enrollment.status,
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        completedAt: enrollment.completedAt?.toISOString()
      })),
      createdAt: careerPath.createdAt.toISOString(),
      updatedAt: careerPath.updatedAt.toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching career path:', error);
    return NextResponse.json(
      { error: 'Failed to fetch career path' },
      { status: 500 }
    );
  }
}

// PATCH - Update career path
export async function PATCH(
  request: Request,
  context: { params: Promise<{ careerPathId: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { careerPathId } = params;

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    // Verify career path exists and user owns it
    const existingPath = await (prisma as any).careerPath.findUnique({
      where: { 
        id: careerPathId,
        createdBy: user.id
      }
    });

    if (!existingPath) {
      return NextResponse.json({ error: 'Career path not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, category, difficulty, estimatedDuration, tags, milestones, isPublished } = body;

    // Convert tags array to comma-separated string
    const tagsString = Array.isArray(tags) ? tags.join(', ') : undefined;

    // Update career path
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration;
    if (tagsString !== undefined) updateData.tags = tagsString;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const careerPath = await (prisma as any).careerPath.update({
      where: { id: careerPathId },
      data: updateData,
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Update milestones if provided
    if (milestones && Array.isArray(milestones)) {
      // Delete existing milestones
      await (prisma as any).careerPathMilestone.deleteMany({
        where: { careerPathId }
      });

      // Create new milestones
      await (prisma as any).careerPathMilestone.createMany({
        data: milestones.map((milestone: any, index: number) => ({
          careerPathId,
          title: milestone.title,
          description: milestone.description,
          order: index + 1,
          isCompleted: milestone.completed || false
        }))
      });

      // Fetch updated career path with new milestones
      const updatedPath = await (prisma as any).careerPath.findUnique({
        where: { id: careerPathId },
        include: {
          milestones: {
            orderBy: { order: 'asc' }
          }
        }
      });

      careerPath.milestones = updatedPath.milestones;
    }

    // Transform response
    const response = {
      id: careerPath.id,
      title: careerPath.title,
      description: careerPath.description,
      category: careerPath.category,
      difficulty: careerPath.difficulty,
      estimatedDuration: careerPath.estimatedDuration,
      tags: careerPath.tags ? careerPath.tags.split(',').map((tag: string) => tag.trim()) : [],
      isPublished: careerPath.isPublished,
      milestones: careerPath.milestones.map((milestone: any) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        completed: milestone.isCompleted,
        order: milestone.order
      })),
      createdAt: careerPath.createdAt.toISOString(),
      updatedAt: careerPath.updatedAt.toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating career path:', error);
    return NextResponse.json(
      { error: 'Failed to update career path' },
      { status: 500 }
    );
  }
}

// DELETE - Delete career path
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ careerPathId: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { careerPathId } = params;

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    // Verify career path exists and user owns it
    const existingPath = await (prisma as any).careerPath.findUnique({
      where: { 
        id: careerPathId,
        createdBy: user.id
      },
      include: {
        enrollments: true
      }
    });

    if (!existingPath) {
      return NextResponse.json({ error: 'Career path not found' }, { status: 404 });
    }

    // Check if there are active enrollments
    const activeEnrollments = existingPath.enrollments.filter((e: any) => e.status === 'ACTIVE');
    if (activeEnrollments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete career path with active enrollments' },
        { status: 400 }
      );
    }

    // Delete career path (cascades to milestones and enrollments)
    await (prisma as any).careerPath.delete({
      where: { id: careerPathId }
    });

    return NextResponse.json({ message: 'Career path deleted successfully' });
  } catch (error) {
    console.error('Error deleting career path:', error);
    return NextResponse.json(
      { error: 'Failed to delete career path' },
      { status: 500 }
    );
  }
}
