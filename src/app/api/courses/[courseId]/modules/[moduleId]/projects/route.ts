import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema for creating a new project
const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string
  isPublished: z.boolean().optional(),
  maxScore: z.number().min(0).optional(),
  skillsRequired: z.array(z.string()).optional(),
  resources: z.array(
    z.object({
      title: z.string(),
      url: z.string().url(),
      type: z.enum(['LINK', 'FILE', 'VIDEO']),
    })
  ).optional(),
  
  // Additional fields from frontend
  difficulty: z.enum(['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'ADVANCED']).optional(),
  estimatedHours: z.number().int().min(0).optional(),
  technologies: z.string().optional(),
  requirements: z.string().optional(),
  allowTeamSubmissions: z.boolean().optional().default(false),
  maxTeamSize: z.number().int().min(2).max(10).optional(),
  githubTemplateUrl: z.string().url().optional(),
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

// GET /api/courses/[courseId]/modules/[moduleId]/projects - Get all projects for a module
export async function GET(request: Request): Promise<Response> {
  try {
    // Extract parameters from URL
    const url = new URL(request.url);
    const courseId = url.pathname.split('/')[3];
    const moduleId = url.pathname.split('/')[5];
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

    // Get projects for this module
    const projects = await prisma.project.findMany({
      where: { moduleId },
      include: {
        _count: {
          select: { 
            submissions: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      data: projects,
      total: projects.length
    });
  } catch (error) {
    console.error('[PROJECTS_GET]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/projects - Create a new project
export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
): Promise<Response> {
  try {
    const { courseId, moduleId } = await params;
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
        instructorId: userId
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'You must be the instructor of this course to create projects' },
        { status: 403 }
      );
    }

    // Verify module exists and belongs to this course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId
      }
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found or does not belong to this course' },
        { status: 404 }
      );
    }

    // Parse and validate request
    // Parse and validate request
    let validationData;
    try {
      const body = await request.json();
      
      // Log the received data for debugging
      console.log('[PROJECT_CREATE] Received data:', JSON.stringify(body, null, 2));
      
      const validationResult = createProjectSchema.safeParse(body);

      if (!validationResult.success) {
        // Log detailed validation errors
        console.error('[PROJECT_CREATE] Validation failed:', JSON.stringify(validationResult.error.format(), null, 2));
        
        return NextResponse.json(
          { 
            error: 'Invalid input', 
            details: validationResult.error.format(),
            receivedData: body  // Include the received data in the error response
          },
          { status: 400 }
        );
      }
      
      // Log successful validation
      console.log('[PROJECT_CREATE] Validation successful');
      validationData = validationResult.data;
    } catch (parseError) {
      console.error('[PROJECT_CREATE] Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse request body', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 400 }
      );
    }

    // Use validationData and only extract fields that exist in the schema
    const { 
      title, 
      description, 
      instructions, 
      dueDate, 
      isPublished = false, 
      maxScore
    } = validationData;

    // Log what we're about to create
    console.log('[PROJECT_CREATE] About to create project with data:', {
      title,
      description: description || null,
      instructions: instructions || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      isPublished,
      moduleId,
      courseId
    });
    
    // Create project using only fields that exist in the Prisma schema
    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        instructions: instructions || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        isPublished,
        moduleId,
        courseId,
        pointsValue: maxScore || 10,
        isRequiredForCertification: true
      }
    });

    // Note: Resources, skills, and other advanced fields are not implemented yet
    // TODO: Add ProjectResource model and other fields to schema if needed

    // Log activity
    await logProjectActivity(userId.toString(), 'create_project', project.id, { title });

    // Revalidate paths
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);

    // Return the created project (no resources to include yet)
    return NextResponse.json({
      data: project
    });
  } catch (error: any) {
    console.error('[PROJECT_CREATE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
