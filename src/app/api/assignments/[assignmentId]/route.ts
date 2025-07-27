import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Assignment update validation schema
const updateAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  instructions: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string
  maxScore: z.number().min(0).optional(),
  submissionType: z.enum(['TEXT', 'FILE', 'URL', 'MIXED']).optional(),
  allowLateSubmissions: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  allowGroupSubmissions: z.boolean().optional(),
  maxGroupSize: z.number().int().min(2).max(10).optional(),
});

// Rubric item schema
const rubricItemSchema = z.object({
  id: z.string().uuid('Invalid rubric item ID').optional(),
  title: z.string().min(1, 'Criteria name is required'),
  points: z.number().min(0),
  order: z.number().int().min(0).optional(),
  description: z.string().optional(),
});

// GET handler - Get a specific assignment
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeRubric = searchParams.get('includeRubric') !== 'false';
  const assignmentId = request.nextUrl.pathname.split('/').pop() || ''; // Get the last part of the URL which is the assignmentId
  // Validate that we got a valid assignmentId
  if (!assignmentId || !assignmentId.match(/^[a-z0-9]{1,}$/i)) {
    return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
  }
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const includeRubric = searchParams.get('includeRubric') !== 'false';
    
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH handler - Update an assignment
export async function PATCH(request: NextRequest) {
  const assignmentId = request.nextUrl.pathname.split('/').pop() || ''; // Get the last part of the URL which is the assignmentId
  // Validate that we got a valid assignmentId
  if (!assignmentId || !assignmentId.match(/^[a-z0-9]{1,}$/i)) {
    return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
  }
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Check if assignment exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { module: true },
    });
    
    if (!existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate input
    const validationResult = updateAssignmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Extract validated data
    const { 
      title,
      instructions,
      dueDate,
      maxScore,
      submissionType,
      allowLateSubmissions,
      isPublished,
      allowGroupSubmissions,
      maxGroupSize,
    } = validationResult.data;
    
    // Update data object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (maxScore !== undefined) updateData.maxScore = maxScore;
    if (submissionType !== undefined) updateData.submissionType = submissionType;
    if (allowLateSubmissions !== undefined) updateData.allowLateSubmissions = allowLateSubmissions;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (allowGroupSubmissions !== undefined) updateData.allowGroupSubmissions = allowGroupSubmissions;
    if (maxGroupSize !== undefined) updateData.maxGroupSize = maxGroupSize;
    
    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: updateData,
    });
    
    // Handle rubric items if provided
    if (body.rubricItems && Array.isArray(body.rubricItems)) {
      try {
        // Validate rubric items
        const rubricItems = z.array(rubricItemSchema).parse(body.rubricItems);
        
        // Process rubric items in a transaction
        await prisma.$transaction(async (tx: any) => {
          // Delete existing rubric items
          await tx.rubricitem.deleteMany({
            where: { assignmentId },
          });
          
          // Create new rubric items
          for (const item of rubricItems) {
            await tx.rubricitem.create({
              data: {
                assignmentId,
                title: item.title,
                points: item.points,
                order: item.order || 0,
                description: item.description || '',
              },
            });
          }
        });
      } catch (error) {
        console.error('Error updating rubric items:', error);
        // We don't fail the whole request if just rubric update fails
      }
    }
    
    // Revalidate cache
    if (existingAssignment.module?.courseId) {
      revalidatePath(`/courses/${existingAssignment.module.courseId}/modules/${existingAssignment.moduleId}`);
    }
    
    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error: any) {
    console.error(`Error updating assignment ${assignmentId}:`, error);
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

// DELETE handler - Delete an assignment
export async function DELETE(request: NextRequest) {
  const assignmentId = request.nextUrl.pathname.split('/').pop() || ''; // Get the last part of the URL which is the assignmentId
  // Validate that we got a valid assignmentId
  if (!assignmentId || !assignmentId.match(/^[a-z0-9]{1,}$/i)) {
    return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
  }
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Check if assignment exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { module: true },
    });
    
    if (!existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    // Delete assignment (and cascade delete rubric items)
    await prisma.assignment.deleteItem({
      where: { id: assignmentId },
    });
    
    // Revalidate cache
    if (existingAssignment.module?.courseId) {
      revalidatePath(`/courses/${existingAssignment.module.courseId}/modules/${existingAssignment.moduleId}`);
    }
    
    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting assignment ${assignmentId}:`, error);
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
