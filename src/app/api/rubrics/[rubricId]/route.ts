/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/rubrics/[rubricId] - Get a specific rubric
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ rubricId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { rubricId } = await params;
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Get the rubric
    const rubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        criteria: {
          include: {
            levels: {
              orderBy: {
                score: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        project: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
                enrollments: {
                  where: {
                    userId: session.user.id,
                  },
                  select: {
                    role: true,
                  },
                },
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!rubric) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }
    
    // Check permissions
    const isInstructor = rubric.project.course.instructorId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    const isEnrolled = rubric.project.course.enrollments.length > 0;
    
    // Only allow access to instructors, admins, or enrolled students
    if (!isInstructor && !isAdmin && !isEnrolled) {
      return NextResponse.json(
        { error: 'You do not have permission to view this rubric' },
        { status: 403 }
      );
    }
    
    // For students, only return published rubrics
    if (!isInstructor && !isAdmin && !rubric.isPublished) {
      return NextResponse.json(
        { error: 'This rubric is not available yet' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(rubric);
  } catch (error) {
    console.error('Error fetching rubric:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubric' },
      { status: 500 }
    );
  }
}

// PATCH /api/rubrics/[rubricId] - Update a rubric
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ rubricId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { rubricId } = await params;
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { 
      name, 
      description, 
      isPublished, 
      criteria,
      projectId 
    } = body;
    
    // Validate request body
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Get the current rubric to check permissions
    const currentRubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        project: {
          select: {
            course: {
              select: {
                instructorId: true,
              },
            },
          },
        },
      },
    });
    
    if (!currentRubric) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }
    
    // Only instructors and admins can update rubrics
    const isInstructor = currentRubric.project.course.instructorId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this rubric' },
        { status: 403 }
      );
    }
    
    // Start a transaction to update the rubric and its criteria
    const [updatedRubric] = await prisma.$transaction([
      // Update the rubric
      prisma.rubric.update({
        where: { id: rubricId },
        data: {
          name,
          description,
          isPublished: isPublished || false,
          projectId,
          updatedAt: new Date(),
        },
        include: {
          criteria: {
            include: {
              levels: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      }),
      // Delete existing criteria and levels
      prisma.rubricCriteriaLevel.deleteMany({
        where: {
          criteria: {
            rubricId,
          },
        },
      }),
      prisma.rubricCriteria.deleteMany({
        where: {
          rubricId,
        },
      }),
    ]);
    
    // Create new criteria and levels if provided
    if (Array.isArray(criteria) && criteria.length > 0) {
      for (const [index, criterion] of criteria.entries()) {
        const { levels, ...criterionData } = criterion;
        
        const createdCriterion = await prisma.rubricCriteria.create({
          data: {
            ...criterionData,
            order: index,
            rubricId,
            levels: {
              create: levels.map((level: any, levelIndex: number) => ({
                ...level,
                order: levelIndex,
              })),
            },
          },
          include: {
            levels: true,
          },
        });
      }
    }
    
    // Fetch the updated rubric with all its relationships
    const fullRubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        criteria: {
          include: {
            levels: {
              orderBy: {
                score: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json(fullRubric);
  } catch (error) {
    console.error('Error updating rubric:', error);
    return NextResponse.json(
      { error: 'Failed to update rubric' },
      { status: 500 }
    );
  }
}

// DELETE /api/rubrics/[rubricId] - Delete a rubric
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ rubricId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { rubricId } = await params;
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Get the rubric to check permissions
    const rubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        project: {
          select: {
            course: {
              select: {
                instructorId: true,
              },
            },
          },
        },
        _count: {
          select: {
            assessments: true,
          },
        },
      },
    });
    
    if (!rubric) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }
    
    // Only instructors and admins can delete rubrics
    const isInstructor = rubric.project.course.instructorId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this rubric' },
        { status: 403 }
      );
    }
    
    // Check if the rubric is used in any assessments
    if (rubric._count.assessments > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete a rubric that is being used in assessments',
          code: 'RUBRIC_IN_USE',
        },
        { status: 400 }
      );
    }
    
    // Start a transaction to delete the rubric and its related data
    await prisma.$transaction([
      // Delete criteria levels first (due to foreign key constraints)
      prisma.rubricCriteriaLevel.deleteMany({
        where: {
          criteria: {
            rubricId,
          },
        },
      }),
      // Then delete criteria
      prisma.rubricCriteria.deleteMany({
        where: {
          rubricId,
        },
      }),
      // Finally delete the rubric
      prisma.rubric.delete({
        where: { id: rubricId },
      }),
    ]);
    
    return NextResponse.json(
      { success: true, message: 'Rubric deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting rubric:', error);
    return NextResponse.json(
      { error: 'Failed to delete rubric' },
      { status: 500 }
    );
  }
}
