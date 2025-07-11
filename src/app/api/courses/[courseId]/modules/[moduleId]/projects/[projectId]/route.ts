import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema for updating a project
const updateProjectSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(), // ISO date string
  isPublished: z.boolean().optional(),
  maxScore: z.number().min(0).optional().nullable(),
  skillsRequired: z.array(z.string()).optional().nullable(),
  resources: z.array(
    z.object({
      id: z.string().optional(), // If updating existing resource
      title: z.string(),
      url: z.string().url(),
      type: z.enum(['LINK', 'FILE', 'VIDEO']),
    })
  ).optional(),
});

// Log project activity
const logProjectActivity = async (userId: string | number, action: string, projectId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId.toString(),
        action,
        entityType: 'project',
        entityId: projectId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log project activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
};

// GET /api/courses/[courseId]/modules/[moduleId]/projects/[projectId] - Get a project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; projectId: string } }
) {
  try {
    const { courseId, moduleId, projectId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is instructor or enrolled in the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    const isInstructor = course?.instructorId === parseInt(userId.toString(), 10);

    if (!isInstructor) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: { 
          userId: parseInt(userId.toString(), 10), 
          courseId, 
          status: { in: ['ACTIVE', 'COMPLETED'] } 
        },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to view projects' },
          { status: 403 }
        );
      }
    }

    // Fetch the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        resources: {
          orderBy: { order: 'asc' }
        },
        submissions: {
          where: isInstructor ? {} : { 
            userId: parseInt(userId.toString(), 10) 
          },
          select: {
            id: true,
            status: true,
            submittedAt: true,
            grade: true,
            feedback: true,
            userId: true
          }
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // For instructors, include all submissions, for students only include their own
    const responseData = {
      ...project,
      submissions: isInstructor ? project.submissions : project.submissions.filter(sub => 
        sub.userId === parseInt(userId.toString(), 10)
      )
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('[PROJECT_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/modules/[moduleId]/projects/[projectId] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; projectId: string } }
) {
  try {
    const { courseId, moduleId, projectId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user is an instructor for this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: parseInt(userId.toString(), 10)
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'You must be the instructor of this course to update projects' },
        { status: 403 }
      );
    }

    // Verify project exists and belongs to this module
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        moduleId
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or does not belong to this module' },
        { status: 404 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validationResult = updateProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { 
      title, 
      description, 
      instructions, 
      dueDate, 
      isPublished,
      maxScore,
      skillsRequired,
      resources
    } = validationResult.data;

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (maxScore !== undefined) updateData.maxScore = maxScore;
    if (skillsRequired !== undefined) updateData.skills = skillsRequired ? JSON.stringify(skillsRequired) : null;

    // Update project in a transaction if resources are provided
    const updatedProject = await prisma.$transaction(async (tx) => {
      // Update the project
      const updated = await tx.project.update({
        where: { id: projectId },
        data: updateData
      });

      // Handle resources if provided
      if (resources) {
        // Delete existing resources
        await tx.projectResource.deleteMany({
          where: { projectId }
        });

        // Create new resources
        await tx.projectResource.createMany({
          data: resources.map((resource, index) => ({
            projectId,
            title: resource.title,
            url: resource.url,
            type: resource.type,
            order: index
          }))
        });
      }

      return await tx.project.findUnique({
        where: { id: projectId },
        include: {
          resources: {
            orderBy: { order: 'asc' }
          }
        }
      });
    });

    // Log activity
    await logProjectActivity(userId.toString(), 'update_project', projectId, updateData);

    // Revalidate paths
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}/projects/${projectId}`);

    return NextResponse.json({ data: updatedProject });
  } catch (error: any) {
    console.error('[PROJECT_UPDATE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/modules/[moduleId]/projects/[projectId] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; projectId: string } }
) {
  try {
    const { courseId, moduleId, projectId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user is an instructor for this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: parseInt(userId.toString(), 10)
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'You must be the instructor of this course to delete projects' },
        { status: 403 }
      );
    }

    // Verify project exists and belongs to this module
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        moduleId
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or does not belong to this module' },
        { status: 404 }
      );
    }

    // Delete project and related resources in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete resources
      await tx.projectResource.deleteMany({
        where: { projectId }
      });

      // Delete submissions
      await tx.projectSubmission.deleteMany({
        where: { projectId }
      });

      // Delete the project
      await tx.project.delete({
        where: { id: projectId }
      });
    });

    // Log activity
    await logProjectActivity(userId.toString(), 'delete_project', projectId, { title: project.title });

    // Revalidate paths
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PROJECT_DELETE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
