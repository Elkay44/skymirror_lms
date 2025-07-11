import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema for updating an assignment
const updateAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(), // Will store instructions
  // For assignments, we'll store metadata in the content field as JSON
  assignmentData: z.object({
    dueDate: z.string().optional().nullable(),
    maxScore: z.number().min(0).optional(),
    submissionType: z.enum(['TEXT', 'FILE', 'LINK', 'MULTIPLE_FILES']).optional(),
    allowLateSubmissions: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    resources: z.array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        url: z.string().url(),
        type: z.enum(['LINK', 'FILE', 'VIDEO']),
      })
    ).optional(),
    rubric: z.array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        description: z.string().optional().nullable(),
        points: z.number().int().min(0),
        criteriaLevels: z.array(
          z.object({
            id: z.string().optional(),
            level: z.string(),
            description: z.string(),
            points: z.number().int().min(0)
          })
        ).optional(),
      })
    ).optional(),
  }).optional(),
});

// Log assignment activity
const logActivity = async (userId: string | number, action: string, lessonId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId.toString(),
        action,
        entityType: 'assignment', // We still call it assignment for clarity
        entityId: lessonId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log assignment activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
};

// GET /api/courses/[courseId]/modules/[moduleId]/assignments/[assignmentId] - Get assignment details
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; assignmentId: string } }
) {
  try {
    const { courseId, moduleId, assignmentId } = params;
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
          { error: 'You must be enrolled in this course to view assignments' },
          { status: 403 }
        );
      }
    }

    // Fetch the assignment (as a lesson with specific ID and moduleId)
    const assignment = await prisma.lesson.findFirst({
      where: {
        id: assignmentId,
        moduleId, // Ensure it belongs to the specified module
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    // Parse the assignment data from the content field (if it's JSON)
    let assignmentData = {};
    if (assignment?.content) {
      try {
        // Check if content is JSON formatted
        if (assignment.content.trim().startsWith('{')) {
          assignmentData = JSON.parse(assignment.content);
        } else {
          // If it's not JSON, we'll assume it's just content/instructions
          assignmentData = { instructions: assignment.content };
        }
      } catch (e) {
        console.error('Failed to parse assignment data:', e);
        // If parsing fails, treat content as regular instructions
        assignmentData = { instructions: assignment.content };
      }
    }

    // For students, include their own submission if any
    let submissionData = null;
    if (!isInstructor) {
      // Look for student progress data as submission
      const progress = await prisma.progress.findFirst({
        where: {
          lessonId: assignmentId,
          userId: parseInt(userId.toString(), 10)
        },
      });
      
      // Use the progress data as submission data
      // The completed field can indicate submission status
      if (progress) {
        submissionData = {
          id: progress.id,
          submitted: progress.completed,
          submittedAt: progress.completedAt,
          // Additional submission details might be stored in a custom field or table
        };
      }
    } else {
      // For instructors, include submission statistics from progress table
      const progressData = await prisma.progress.findMany({
        where: { 
          lessonId: assignmentId,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });
      
      // Calculate basic statistics
      const stats = {
        total: progressData.length,
        submitted: progressData.filter(p => p.completed).length,
        // Since we don't have direct grading in Progress, we provide completion statistics
        completionRate: progressData.length > 0 ? 
          (progressData.filter(p => p.completed).length / progressData.length) * 100 : 0
      };
      
      submissionData = {
        submissions: progressData.map(p => ({
          id: p.id,
          userId: p.userId,
          userName: p.user?.name || 'Unknown',
          userEmail: p.user?.email || 'Unknown',
          submitted: p.completed,
          submittedAt: p.completedAt,
        })),
        stats
      };
    }

    // Construct a response that looks like an assignment object
    return NextResponse.json({
      data: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        moduleId: assignment.moduleId,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        // Include all the assignment-specific data
        ...assignmentData,
        // And submission data
        submissionData
      }
    });
  } catch (error) {
    console.error('[ASSIGNMENT_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/modules/[moduleId]/assignments/[assignmentId] - Update an assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; assignmentId: string } }
) {
  try {
    const { courseId, moduleId, assignmentId } = params;
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
        { error: 'You must be the instructor of this course to update assignments' },
        { status: 403 }
      );
    }

    // Verify assignment exists and belongs to this module
    const assignment = await prisma.lesson.findFirst({
      where: {
        id: assignmentId,
        moduleId
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or does not belong to this module' },
        { status: 404 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validationResult = updateAssignmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { 
      title, 
      description, 
      content,
      assignmentData
    } = validationResult.data;

    // Build update data for the lesson
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    
    // Handle content and assignment data
    if (content !== undefined && !assignmentData) {
      // If only content is provided, use it directly
      updateData.content = content;
    } else if (assignmentData) {
      // If assignmentData is provided, we need to merge it with existing data
      // Get current assignment data from content field
      let currentData = {};
      if (assignment?.content) {
        try {
          if (assignment.content.trim().startsWith('{')) {
            currentData = JSON.parse(assignment.content);
          } else {
            currentData = { instructions: assignment.content };
          }
        } catch (e) {
          console.error('Failed to parse existing assignment data:', e);
          currentData = { instructions: assignment.content || '' };
        }
      }
      
      // If content is also provided, update instructions in the data
      if (content !== undefined) {
        currentData = { ...currentData, instructions: content };
      }
      
      // Merge with new assignment data
      updateData.content = JSON.stringify({
        ...currentData,
        ...assignmentData
      });
    }

    // Update assignment in a transaction if resources or rubric are provided
    const updatedAssignment = await prisma.$transaction(async (tx) => {
      // Update the lesson
      const updated = await tx.lesson.update({
        where: { id: assignmentId },
        data: updateData,
      });
      
      return updated;
    });

    // Log the update activity
    await logActivity(
      userId,
      'update',
      assignmentId,
      { courseId, moduleId, ...updateData }
    );

    // Revalidate paths
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}/assignments/${assignmentId}`);
    revalidatePath(`/api/courses/${courseId}/modules/${moduleId}/assignments/${assignmentId}`);

    return NextResponse.json({
      data: { id: assignmentId, success: true }
    });
  } catch (error: any) {
    console.error('[ASSIGNMENT_UPDATE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/modules/[moduleId]/assignments/[assignmentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; assignmentId: string } }
) {
  try {
    const { courseId, moduleId, assignmentId } = params;
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
        { error: 'You must be the instructor of this course to delete assignments' },
        { status: 403 }
      );
    }

    // Verify assignment exists and belongs to this module
    const assignment = await prisma.lesson.findFirst({
      where: {
        id: assignmentId,
        moduleId
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or does not belong to this module' },
        { status: 404 }
      );
    }

    // Use transaction to delete assignment (lesson) and all related data
    await prisma.$transaction(async (tx) => {
      // Delete student progress records
      await tx.progress.deleteMany({
        where: { lessonId: assignmentId }
      });
      
      // We don't need to delete content blocks as they're part of the content field

      // Finally delete the lesson (assignment)
      await tx.lesson.delete({
        where: { id: assignmentId }
      });
    });

    // Log the deletion
    await logActivity(
      userId,
      'delete',
      assignmentId,
      { courseId, moduleId }
    );

    // Revalidate paths
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);
    revalidatePath(`/api/courses/${courseId}/modules/${moduleId}/assignments`);

    return NextResponse.json({
      data: { success: true }
    });
  } catch (error) {
    console.error('[ASSIGNMENT_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
