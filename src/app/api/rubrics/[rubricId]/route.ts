import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/rubrics/[rubricId] - Get a specific rubric
export async function GET(req: NextRequest, { params }: { params: { rubricId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { rubricId } = params;
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the rubric
    const rubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        criteria: {
          include: {
            levels: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        project: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: { userId: session.user.id },
                },
                instructor: {
                  select: {
                    id: true,
                  },
                },
                mentors: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    if (!rubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }
    
    // Check if user has access to this rubric
    if (session.user.role === 'Student') {
      // Students can only access rubrics for projects in courses they're enrolled in
      if (
        !rubric.project ||
        !rubric.project.course ||
        rubric.project.course.enrollments.length === 0
      ) {
        return NextResponse.json(
          { error: 'You do not have permission to view this rubric' },
          { status: 403 }
        );
      }
    } else if (
      session.user.role === 'Instructor' ||
      session.user.role === 'Mentor'
    ) {
      // Instructors and mentors can access rubrics they created or are associated with the course
      const isCreator = rubric.createdById === session.user.id;
      const isInstructor = rubric.project?.course?.instructor?.id === session.user.id;
      const isMentor = rubric.project?.course?.mentors.length > 0;
      
      if (!isCreator && !isInstructor && !isMentor) {
        return NextResponse.json(
          { error: 'You do not have permission to view this rubric' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'You do not have permission to view rubrics' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ rubric });
  } catch (error) {
    console.error('Error fetching rubric:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubric' },
      { status: 500 }
    );
  }
}

// PATCH /api/rubrics/[rubricId] - Update a rubric
export async function PATCH(req: NextRequest, { params }: { params: { rubricId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { rubricId } = params;
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and mentors can update rubrics
    if (session.user.role !== 'Instructor' && session.user.role !== 'Mentor') {
      return NextResponse.json(
        { error: 'Only instructors and mentors can update rubrics' },
        { status: 403 }
      );
    }
    
    // Get the existing rubric
    const existingRubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        project: {
          include: {
            course: {
              select: {
                instructorId: true,
                mentors: true,
              },
            },
          },
        },
      },
    });
    
    if (!existingRubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }
    
    // Check if user has permission to update this rubric
    const isCreator = existingRubric.createdById === session.user.id;
    const isInstructor = existingRubric.project?.course?.instructorId === session.user.id;
    const isMentor = existingRubric.project?.course?.mentors.some(
      mentor => mentor.userId === session.user.id
    );
    
    if (!isCreator && !isInstructor && !isMentor) {
      return NextResponse.json(
        { error: 'You do not have permission to update this rubric' },
        { status: 403 }
      );
    }
    
    const data = await req.json();
    const { title, description, maxPoints, criteria, projectId } = data;
    
    if (!title) {
      return NextResponse.json({ error: 'Rubric title is required' }, { status: 400 });
    }
    
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json({ error: 'At least one criterion is required' }, { status: 400 });
    }
    
    // If changing projectId, verify it exists and user has access to it
    if (projectId && projectId !== existingRubric.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          course: {
            select: {
              instructorId: true,
              mentors: true,
            },
          },
        },
      });
      
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      
      // Check if user is instructor or mentor for this course
      const isProjectInstructor = project.course.instructorId === session.user.id;
      const isProjectMentor = project.course.mentors.some(mentor => mentor.userId === session.user.id);
      
      if (!isProjectInstructor && !isProjectMentor) {
        return NextResponse.json(
          { error: 'You do not have permission to assign rubrics to this project' },
          { status: 403 }
        );
      }
    }
    
    // Update the rubric - this requires a transaction to handle the updates to related criteria and levels
    const updatedRubric = await prisma.$transaction(async (tx) => {
      // Update the main rubric record
      const rubric = await tx.rubric.update({
        where: { id: rubricId },
        data: {
          title,
          description: description || '',
          maxPoints: maxPoints || 100,
          projectId: projectId || null,
        },
      });
      
      // Delete all existing criteria and levels (easier than trying to sync changes)
      await tx.rubricLevel.deleteMany({
        where: {
          criterion: {
            rubricId,
          },
        },
      });
      
      await tx.rubricCriterion.deleteMany({
        where: { rubricId },
      });
      
      // Create new criteria and levels
      for (let i = 0; i < criteria.length; i++) {
        const criterion = criteria[i];
        
        const newCriterion = await tx.rubricCriterion.create({
          data: {
            rubricId,
            name: criterion.name,
            description: criterion.description || '',
            weight: criterion.weight || 1,
            order: i,
          },
        });
        
        // Create levels for this criterion
        for (const level of criterion.levels) {
          await tx.rubricLevel.create({
            data: {
              criterionId: newCriterion.id,
              name: level.name,
              points: level.points,
              description: level.description || '',
            },
          });
        }
      }
      
      // Return the updated rubric with all relations
      return tx.rubric.findUnique({
        where: { id: rubricId },
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
      });
    });
    
    return NextResponse.json({ rubric: updatedRubric });
  } catch (error) {
    console.error('Error updating rubric:', error);
    return NextResponse.json(
      { error: 'Failed to update rubric' },
      { status: 500 }
    );
  }
}

// DELETE /api/rubrics/[rubricId] - Delete a rubric
export async function DELETE(req: NextRequest, { params }: { params: { rubricId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { rubricId } = params;
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and mentors can delete rubrics
    if (session.user.role !== 'Instructor' && session.user.role !== 'Mentor') {
      return NextResponse.json(
        { error: 'Only instructors and mentors can delete rubrics' },
        { status: 403 }
      );
    }
    
    // Get the existing rubric
    const existingRubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        project: {
          include: {
            course: {
              select: {
                instructorId: true,
                mentors: true,
              },
            },
          },
        },
      },
    });
    
    if (!existingRubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }
    
    // Check if user has permission to delete this rubric
    const isCreator = existingRubric.createdById === session.user.id;
    const isInstructor = existingRubric.project?.course?.instructorId === session.user.id;
    
    if (!isCreator && !isInstructor) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this rubric' },
        { status: 403 }
      );
    }
    
    // Check if this rubric has been used in any assessments
    const assessmentCount = await prisma.rubricAssessment.count({
      where: { rubricId },
    });
    
    if (assessmentCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a rubric that has been used in assessments' },
        { status: 400 }
      );
    }
    
    // Delete the rubric and all related records
    await prisma.$transaction(async (tx) => {
      // Delete all levels first
      await tx.rubricLevel.deleteMany({
        where: {
          criterion: {
            rubricId,
          },
        },
      });
      
      // Delete all criteria
      await tx.rubricCriterion.deleteMany({
        where: { rubricId },
      });
      
      // Delete the rubric itself
      await tx.rubric.delete({
        where: { id: rubricId },
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    return NextResponse.json(
      { error: 'Failed to delete rubric' },
      { status: 500 }
    );
  }
}
