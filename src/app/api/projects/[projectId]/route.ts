import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/projects/[projectId] - Get a specific project
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { projectId } = params;
    const userId = session.user.id;
    const role = session.user.role;
    
    // Find the project with appropriate data based on role
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        course: {
          select: {
            title: true,
            instructorId: true,
            enrollments: role === 'STUDENT' ? {
              where: { userId },
              select: { id: true }
            } : undefined
          }
        },
        submissions: role === 'STUDENT' ? {
          where: { studentId: userId },
          orderBy: { submittedAt: 'desc' }
        } : role === 'INSTRUCTOR' ? {
          orderBy: { submittedAt: 'desc' },
          include: {
            student: {
              select: { name: true, email: true }
            }
          }
        } : undefined,
        module: true
      }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Check authorization based on role
    if (role === 'INSTRUCTOR' && project.course.instructorId !== userId) {
      return NextResponse.json({ error: 'Not authorized to access this project' }, { status: 403 });
    }
    
    if (role === 'STUDENT' && (!project.course.enrollments || project.course.enrollments.length === 0)) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }
    
    if (role === 'MENTOR') {
      // Check if any of mentor's mentees are enrolled in this course
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId }
      });
      
      if (!mentorProfile) {
        return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
      }
      
      const hasAccessToProject = await prisma.mentorship.findFirst({
        where: {
          mentorId: mentorProfile.id,
          status: 'ACTIVE',
          student: {
            user: {
              enrollments: {
                some: { courseId: project.courseId }
              }
            }
          }
        }
      });
      
      if (!hasAccessToProject) {
        return NextResponse.json({ error: 'None of your mentees are enrolled in this course' }, { status: 403 });
      }
    }
    
    // Parse skills JSON if it exists
    if (project.skills && typeof project.skills === 'string') {
      try {
        project.skills = JSON.parse(project.skills);
      } catch (e) {
        console.error('Error parsing skills JSON:', e);
      }
    }
    
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PATCH /api/projects/[projectId] - Update a project (instructors only)
export async function PATCH(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Only instructors can update projects' }, { status: 403 });
    }
    
    const { projectId } = params;
    const body = await req.json();
    const { 
      title, 
      description, 
      instructions,
      dueDate, 
      skills, 
      pointsValue,
      isPublished,
      isRequiredForCertification, 
      moduleId 
    } = body;
    
    // Verify instructor owns this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        course: {
          instructorId: session.user.id
        }
      }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found or you do not have permission to update it' }, { status: 404 });
    }
    
    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        instructions: instructions !== undefined ? instructions : undefined,
        dueDate: dueDate !== undefined ? new Date(dueDate) : undefined,
        pointsValue: pointsValue !== undefined ? pointsValue : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined,
        isRequiredForCertification: isRequiredForCertification !== undefined ? isRequiredForCertification : undefined,
        moduleId: moduleId !== undefined ? moduleId : undefined,
        skills: skills !== undefined ? JSON.stringify(skills) : undefined,
      }
    });
    
    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[projectId] - Delete a project (instructors only)
export async function DELETE(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Only instructors can delete projects' }, { status: 403 });
    }
    
    const { projectId } = params;
    
    // Verify instructor owns this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        course: {
          instructorId: session.user.id
        }
      }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found or you do not have permission to delete it' }, { status: 404 });
    }
    
    // Delete the project
    await prisma.project.delete({
      where: { id: projectId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
