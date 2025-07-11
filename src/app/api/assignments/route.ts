import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Assignment creation validation schema
const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  instructions: z.string().optional(),
  moduleId: z.string().uuid('Invalid module ID'),
  dueDate: z.string().optional(), // ISO date string
  maxScore: z.number().min(0).optional(),
  submissionType: z.enum(['TEXT', 'FILE', 'URL', 'MIXED']).default('MIXED'),
  allowLateSubmissions: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  allowGroupSubmissions: z.boolean().optional(),
  maxGroupSize: z.number().int().min(2).max(10).optional(),
  rubricItems: z.array(z.object({
    criteriaName: z.string().min(1, 'Criteria name is required'),
    maxPoints: z.number().min(0),
    description: z.string().optional(),
  })).optional(),
});

// Log assignment activity
const logAssignmentActivity = async (userId: string | number, action: string, assignmentId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType: 'assignment',
        entityId: assignmentId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log assignment activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
};

// GET handler - Get all assignments or filter by moduleId
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const includeRubric = searchParams.get('includeRubric') === 'true';
    
    // Query parameters
    const where = moduleId ? { moduleId } : {};
    
    // Get assignments with optional filtering
    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        rubricItems: includeRubric,
      },
    });
    
    return NextResponse.json({ assignments });
  } catch (error: any) {
    console.error('Error getting assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

// POST handler - Create a new assignment
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Get request body
    const body = await request.json();
    
    // Validate input
    const validationResult = createAssignmentSchema.safeParse(body);
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
      moduleId,
      dueDate,
      maxScore,
      submissionType,
      allowLateSubmissions,
      isPublished,
      allowGroupSubmissions,
      maxGroupSize,
      rubricItems
    } = validationResult.data;
    
    // Check if module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });
    
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    
    // Create assignment with rubric items in a transaction
    const assignment = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      // Create the assignment
      const newAssignment = await tx.assignment.create({
        data: {
          title,
          instructions: instructions || '',
          moduleId,
          dueDate: dueDate ? new Date(dueDate) : null,
          maxScore: maxScore || 100,
          submissionType,
          allowLateSubmissions: allowLateSubmissions ?? false,
          isPublished: isPublished ?? false,
          allowGroupSubmissions: allowGroupSubmissions ?? false,
          maxGroupSize: maxGroupSize ?? null,
        },
      });
      
      // Create rubric items if provided
      if (rubricItems && rubricItems.length > 0) {
        for (const item of rubricItems) {
          await tx.rubricItem.create({
            data: {
              assignmentId: newAssignment.id,
              criteriaName: item.criteriaName,
              maxPoints: item.maxPoints,
              description: item.description || '',
            },
          });
        }
      }
      
      return newAssignment;
    });
    
    // Log activity
    // Ensure assignment is properly returned from the transaction
    if (!assignment || typeof assignment !== 'object') {
      throw new Error('Transaction did not return a valid assignment object');
    }
    
    await logAssignmentActivity(userId.toString(), 'create_assignment', assignment.id, { title });
    
    // Revalidate cache
    revalidatePath(`/courses/${module.courseId}/modules/${moduleId}`);
    
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
