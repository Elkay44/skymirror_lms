import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper function to get the authenticated user's ID
async function getUserId(session: any): Promise<string> {
  if (!session?.user?.id) {
    throw new Error('Unauthorized: User not authenticated');
  }
  return session.user.id;
}

// Helper function to check if user is an instructor for a course
async function isCourseInstructor(
  prisma: any,
  courseId: string,
  userId: string
): Promise<boolean> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true }
  });
  
  return course?.instructorId === userId;
}

// Helper function to get a rubric with its related data
async function getRubricWithItems(
  prisma: any,
  rubricId: string
): Promise<any | null> {
  return prisma.rubric.findUnique({
    where: { id: rubricId },
    include: {
      items: {
        include: {
          criteria: {
            include: {
              levels: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      },
      assignments: {
        include: {
          module: {
            include: {
              course: true
            }
          }
        }
      }
    }
  });
}

// GET /api/rubrics/[rubricId] - Get a specific rubric
export async function GET(
  request: Request
) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const rubricId = pathSegments[pathSegments.length - 1];
  
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserId(session);
    
    const rubric = await getRubricWithItems(prisma, rubricId);
    
    if (!rubric) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to this rubric
    const courseId = rubric.assignments[0]?.module?.courseId;
    if (courseId && !(await isCourseInstructor(prisma, courseId, userId))) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to access this rubric' },
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
  request: Request
) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const rubricId = pathSegments[pathSegments.length - 1];
  
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserId(session);
    
    // Get the rubric with its assignments
    const rubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        assignments: {
          include: {
            module: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });
    
    if (!rubric) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is an instructor for the course
    const courseId = rubric.assignments[0]?.module?.course?.id;
    if (courseId && !(await isCourseInstructor(prisma, courseId, userId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const data = await request.json();
    
    // Start a transaction to update the rubric and its items
    await prisma.$transaction([
      // Update the rubric
      prisma.rubric.update({
        where: { id: rubricId },
        data: {
          title: data.title || undefined,
          description: data.description || undefined,
          isDefault: data.isDefault || false
        }
      }),
      
      // Delete existing items
      prisma.rubricItem.deleteMany({
        where: { rubricId: rubricId }
      }),
      
      // Create new rubric items
      ...(data.items && data.items.length > 0 ? data.items.map((item: any) => 
        prisma.rubricItem.create({
          data: {
            title: item.title,
            description: item.description,
            points: item.points || 0,
            order: item.order || 0,
            rubricId: rubricId
          }
        })
      ) : [])
    ]);
    
    // Fetch the updated rubric with its items
    const updatedRubric = await getRubricWithItems(prisma, rubricId);
    
    return NextResponse.json(updatedRubric);
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
  request: Request
) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const rubricId = pathSegments[pathSegments.length - 1];
  
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserId(session);
    
    // Get the rubric to check permissions
    const rubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        assignments: {
          include: {
            module: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });
    
    if (!rubric) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to delete this rubric
    const courseId = rubric.assignments[0]?.module?.course?.id;
    if (courseId && !(await isCourseInstructor(prisma, courseId, userId))) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to delete this rubric' },
        { status: 403 }
      );
    }
    
    // Delete the rubric and its items in a transaction
    await prisma.$transaction([
      prisma.rubricItem.deleteMany({
        where: { rubricId: rubricId }
      }),
      prisma.rubric.delete({
        where: { id: rubricId }
      })
    ]);
    
    return NextResponse.json({ message: 'Rubric deleted successfully' });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    return NextResponse.json(
      { error: 'Failed to delete rubric' },
      { status: 500 }
    );
  }
}
