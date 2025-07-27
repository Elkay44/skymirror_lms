import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/rubrics - Get all rubrics (filtered by project or instructor)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    
    let rubrics;
    
    if (projectId) {
      // First check if the user has access to this project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          course: true,
        },
      });
      
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      
      // Check user's role and permissions
      if (session.user.role === 'Student') {
        // Students can only view rubrics for projects in courses they're enrolled in
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            userId: session.user.id,
            courseId: project.courseId,
          },
        });
        
        if (!enrollment) {
          return NextResponse.json(
            { error: 'You are not enrolled in this course' },
            { status: 403 }
          );
        }
      } else if (session.user.role !== 'Instructor' && session.user.role !== 'Mentor') {
        return NextResponse.json(
          { error: 'You do not have permission to view rubrics' },
          { status: 403 }
        );
      }
      
      // Get rubrics for this project
      rubrics = await prisma.rubric.findMany({
        where: { projectId },
        include: {
          criteria: {
            include: {
              levels: true,
            },
            orderBy: {
              order: 'asc',
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
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } else if (session.user.role === 'Instructor' || session.user.role === 'Mentor') {
      // Get all rubrics created by this instructor/mentor
      rubrics = await prisma.rubric.findMany({
        where: { createdById: session.user.id },
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
            select: {
              id: true,
              title: true,
              courseId: true,
              course: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } else {
      return NextResponse.json(
        { error: 'You do not have permission to view rubrics' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ rubrics });
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubrics' },
      { status: 500 }
    );
  }
}

// POST /api/rubrics - Create a new rubric
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and mentors can create rubrics
    if (session.user.role !== 'Instructor' && session.user.role !== 'Mentor') {
      return NextResponse.json(
        { error: 'Only instructors and mentors can create rubrics' },
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
    
    // If projectId is provided, verify it exists and user has access to it
    if (projectId) {
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
      const isInstructor = project.course.instructorId === session.user.id;
      const isMentor = project.course.mentors.some((mentor: { userId: string | number }) => mentor.userId === session.user.id);
      
      if (!isInstructor && !isMentor) {
        return NextResponse.json(
          { error: 'You do not have permission to create rubrics for this project' },
          { status: 403 }
        );
      }
    }
    
    // Create the rubric
    const rubric = await prisma.rubric.create({
      data: {
        title,
        description: description || '',
        maxPoints: maxPoints || 100,
        projectId: projectId || null,
        createdById: session.user.id,
        criteria: {
          create: criteria.map((criterion: any, index: number) => ({
            name: criterion.name,
            description: criterion.description || '',
            weight: criterion.weight || 1,
            order: index,
            levels: {
              create: criterion.levels.map((level: any) => ({
                name: level.name,
                points: level.points,
                description: level.description || '',
              })),
            },
          })),
        },
      },
      include: {
        criteria: {
          include: {
            levels: true,
          },
        },
      },
    });
    
    return NextResponse.json({ rubric });
  } catch (error) {
    console.error('Error creating rubric:', error);
    return NextResponse.json(
      { error: 'Failed to create rubric' },
      { status: 500 }
    );
  }
}
