/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/projects/[projectId]/submissions - Get all submissions for a project
export async function GET(
  _req: Request, 
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { projectId } = await params;

    // Check if project exists using direct SQL query since this model might not be in the ExtendedPrismaClient
    const projects = await prisma.$queryRaw<any[]>`
      SELECT p.*, c.title as course_title 
      FROM "Project" p
      JOIN "Course" c ON p."courseId" = c.id
      WHERE p.id = ${projectId}
    `;
    
    const project = projects.length > 0 ? projects[0] : null;
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is instructor or mentor for this course
    const courseAccess = await prisma.$queryRaw<{is_instructor: number, is_mentor: number}[]>`
      SELECT 
        COUNT(CASE WHEN e.role = 'INSTRUCTOR' THEN 1 END) as is_instructor,
        COUNT(CASE WHEN e.role = 'MENTOR' THEN 1 END) as is_mentor
      FROM "Enrollment" e
      WHERE e."courseId" = ${project.courseId} 
      AND e."userId" = ${userId}
      GROUP BY e."userId"
    `;

    const isInstructor = courseAccess.length > 0 && courseAccess[0].is_instructor > 0;
    const isMentor = courseAccess.length > 0 && courseAccess[0].is_mentor > 0;
    const isAdmin = session.user.role === 'ADMIN';
    const isAuthor = project.authorId === userId;

    // Only allow access to instructors, mentors, admins, or the project author
    if (!isInstructor && !isMentor && !isAdmin && !isAuthor) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all submissions for this project
    const submissions = await prisma.$queryRaw<any[]>`
      SELECT 
        ps.*,
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        u.image as student_image,
        r.id as reviewer_id,
        r.name as reviewer_name,
        r.email as reviewer_email
      FROM "ProjectSubmission" ps
      JOIN "User" u ON ps."studentId" = u.id
      LEFT JOIN "User" r ON ps."reviewerId" = r.id
      WHERE ps."projectId" = ${projectId}
      ORDER BY ps."submittedAt" DESC
    `;

    // Format the response
    const formattedSubmissions = submissions.map(sub => ({
      id: sub.id,
      projectId: sub.projectId,
      student: {
        id: sub.student_id,
        name: sub.student_name,
        email: sub.student_email,
        image: sub.student_image,
      },
      submissionNotes: sub.submissionNotes,
      attachments: sub.attachments || [],
      status: sub.status,
      grade: sub.grade,
      reviewNotes: sub.reviewNotes,
      reviewer: sub.reviewer_id ? {
        id: sub.reviewer_id,
        name: sub.reviewer_name,
        email: sub.reviewer_email,
      } : null,
      submittedAt: sub.submittedAt,
      reviewedAt: sub.reviewedAt,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        courseId: project.courseId,
        courseTitle: project.course_title,
      },
      submissions: formattedSubmissions,
    });
  } catch (error) {
    console.error('Error fetching project submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project submissions' },
      { status: 500 }
    );
  }
}
