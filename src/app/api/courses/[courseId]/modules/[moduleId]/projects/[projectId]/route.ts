/* eslint-disable */
import { NextResponse } from 'next/server';
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
    const detailsJson = typeof details === 'object' ? JSON.stringify(details) : details;
    
    await prisma.$queryRaw`
      INSERT INTO "ActivityLog" ("userId", action, "entityType", "entityId", details)
      VALUES (
        ${userId.toString()}, 
        ${action}, 
        'project', 
        ${projectId}, 
        ${detailsJson}::jsonb
      )
    `;
  } catch (error) {
    console.error('Failed to log project activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
};

// GET /api/courses/[courseId]/modules/[moduleId]/projects/[projectId] - Get a project by ID
export async function GET(request: Request): Promise<Response> {
  try {
    // Extract parameters from URL
    const url = new URL(request.url);
    const courseId = url.pathname.split('/')[3];
    const projectId = url.pathname.split('/')[7];

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

    const isInstructor = course?.instructorId === userId.toString();

    if (!isInstructor) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: { 
          userId: userId.toString(), 
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
    const projectResult = await prisma.$queryRaw`
      SELECT * FROM "Project" 
      WHERE id = ${projectId} 
      LIMIT 1
    ` as any[];
    
    const project = projectResult[0];

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch project resources
    const resources = await prisma.$queryRaw`
      SELECT * FROM "ProjectResource" 
      WHERE "projectId" = ${projectId}
      ORDER BY "order" ASC
    ` as any[];

    // Fetch project submissions
    const submissions = (isInstructor 
      ? await prisma.$queryRaw`
          SELECT id, status, "submittedAt", grade, feedback, "userId"
          FROM "ProjectSubmission" 
          WHERE "projectId" = ${projectId}
        `
      : await prisma.$queryRaw`
          SELECT id, status, "submittedAt", grade, feedback, "userId"
          FROM "ProjectSubmission" 
          WHERE "projectId" = ${projectId} 
          AND "userId" = '${userId.toString()}'
        `
    ) as Array<{
      id: string;
      status: string;
      submittedAt: Date;
      grade: number | null;
      feedback: string | null;
      userId: number;
    }>;

    const responseData = {
      ...project,
      resources,
      submissions: isInstructor ? submissions : submissions.filter(sub => 
        sub.userId.toString() === userId.toString()
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
export async function PATCH(request: Request): Promise<Response> {
  try {
    // Extract parameters from URL
    const url = new URL(request.url);
    const courseId = url.pathname.split('/')[3];
    const moduleId = url.pathname.split('/')[5];
    const projectId = url.pathname.split('/')[7];

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user is an instructor for this course
    const [course] = await prisma.$queryRaw`
      SELECT id FROM "Course" 
      WHERE id = '${courseId}' AND "instructorId" = '${userId.toString()}'
      LIMIT 1
    ` as any[];

    if (!course) {
      return NextResponse.json(
        { error: 'You must be the instructor of this course to update projects' },
        { status: 403 }
      );
    }

    // Verify project exists
    const [project] = await prisma.$queryRaw`
      SELECT id FROM "Project" 
      WHERE id = ${projectId}
      LIMIT 1
    ` as any[];

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
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

    // Build the SET clause for the project update
    const setClause = Object.entries(updateData)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        if (key === 'skillsRequired' && Array.isArray(value)) {
          return `"${key}" = '${JSON.stringify(value)}'`;
        }
        if (value === null) {
          return `"${key}" = NULL`;
        }
        if (typeof value === 'string') {
          // Escape single quotes in strings
          const escapedValue = value.replace(/'/g, "''");
          return `"${key}" = '${escapedValue}'`;
        }
        if (value instanceof Date) {
          return `"${key}" = '${value.toISOString()}'`;
        }
        return `"${key}" = ${value}`;
      })
      .join(', ');

    // Update the project
    await prisma.$queryRaw`
      UPDATE "Project" 
      SET ${setClause}
      WHERE id = ${projectId}
    `;

    // Handle resources if provided
    if (resources) {
      // Delete existing resources
      await prisma.$queryRaw`
        DELETE FROM "ProjectResource" 
        WHERE "projectId" = ${projectId}
      `;

      // Create new resources
      if (resources.length > 0) {
        const values = resources
          .map((resource, index) => 
            `('${projectId}', '${resource.title.replace(/'/g, "''")}', '${resource.url}', '${resource.type}', ${index})`
          )
          .join(', ');

        await prisma.$queryRaw`
          INSERT INTO "ProjectResource" ("projectId", title, url, type, "order")
          VALUES ${values}
        `;
      }
    }

    // Fetch the updated project with resources
    const [updatedProject] = await prisma.$queryRaw`
      SELECT * FROM "Project" 
      WHERE id = ${projectId} 
      LIMIT 1
    ` as any[];

    if (updatedProject) {
      const [projectResources] = await prisma.$queryRaw`
        SELECT * FROM "ProjectResource" 
        WHERE "projectId" = ${projectId}
        ORDER BY "order" ASC
      ` as any[];

      updatedProject.resources = projectResources || [];
    }

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
export async function DELETE(request: Request): Promise<Response> {
  try {
    // Extract parameters from URL
    const url = new URL(request.url);
    const courseId = url.pathname.split('/')[3];
    const moduleId = url.pathname.split('/')[5];
    const projectId = url.pathname.split('/')[7];

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify project exists and belongs to this module and course
    const [project] = await prisma.$queryRaw`
      SELECT p.id 
      FROM "Project" p
      JOIN "Module" m ON p."moduleId" = m.id
      WHERE p.id = ${projectId} 
        AND p."moduleId" = ${moduleId}
        AND m."courseId" = ${courseId}
      LIMIT 1
    ` as any[];

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or does not belong to this module' },
        { status: 404 }
      );
    }

    // Delete project and related resources in a transaction
    await prisma.$transaction([
      prisma.$queryRaw`
        DELETE FROM "ProjectResource" 
        WHERE "projectId" = ${projectId}
      `,
      prisma.$queryRaw`
        DELETE FROM "ProjectSubmission" 
        WHERE "projectId" = ${projectId}
      `,
      prisma.$queryRaw`
        DELETE FROM "Project" 
        WHERE id = ${projectId}
      `
    ]);

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
