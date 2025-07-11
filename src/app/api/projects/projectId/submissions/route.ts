import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/projects/[projectId]/submissions - Get all submissions for a project
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { projectId } = params;

    // Check if project exists using direct SQL query since this model might not be in the ExtendedPrismaClient
    const projects = await prisma.$queryRaw<any[]>`
      SELECT p.*, c.title as course_title 
      FROM "Project" p
      JOIN "Course" c ON p."courseId" = c.id
      WHERE p.id = ${projectId}
    `;
    
    const project = projects.length > 0 ? projects[0] : null;
    
    // Check if user is instructor or mentor for this course
    const courseAccess = await prisma.$queryRaw<{is_instructor: number, is_mentor: number}[]>`
      SELECT 
        (SELECT COUNT(*) FROM "Course" WHERE id = ${project?.courseId} AND "instructorId" = ${userId}) as is_instructor,
        (SELECT COUNT(*) FROM "CourseMentor" WHERE "courseId" = ${project?.courseId} AND "mentorId" = ${userId}) as is_mentor
    `;
    
    const isInstructor = courseAccess[0]?.is_instructor > 0;
    const isMentor = courseAccess[0]?.is_mentor > 0;

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only instructors and mentors can view all submissions
    if (!isInstructor && !isMentor) {
      // For students, only return their own submissions
      // Get student's own submissions using direct SQL query
      const studentSubmissions = await prisma.$queryRaw<any[]>`
        SELECT ps.*, 
          u.id as student_id, u.name as student_name, u.email as student_email, u.image as student_image
        FROM "ProjectSubmission" ps
        JOIN "User" u ON ps."studentId" = u.id
        WHERE ps."projectId" = ${projectId} AND ps."studentId" = ${userId}
        ORDER BY ps."submittedAt" DESC
      `;
      
      // Format the submissions to match our expected structure
      const formattedStudentSubmissions = studentSubmissions.map((sub: any) => ({
        id: sub.id,
        projectId: sub.projectId,
        submissionUrl: sub.submissionUrl,
        submissionText: sub.submissionText,
        submissionFiles: sub.submissionFiles,
        status: sub.status,
        grade: sub.grade,
        feedback: sub.feedback,
        revisionCount: sub.revisionCount,
        submittedAt: sub.submittedAt,
        reviewedAt: sub.reviewedAt,
        student: {
          id: sub.student_id,
          name: sub.student_name,
          email: sub.student_email,
          image: sub.student_image
        }
      }));

      return NextResponse.json({ submissions: formattedStudentSubmissions });
    }

    // Fetch all submissions for instructors/mentors using direct SQL query
    const allSubmissions = await prisma.$queryRaw<any[]>`
      SELECT ps.*, 
        u.id as student_id, u.name as student_name, u.email as student_email, u.image as student_image
      FROM "ProjectSubmission" ps
      JOIN "User" u ON ps."studentId" = u.id
      WHERE ps."projectId" = ${projectId}
      ORDER BY ps."submittedAt" DESC
    `;
    
    // Format the submissions to match our expected structure
    const submissions = allSubmissions.map((sub: any) => ({
      id: sub.id,
      projectId: sub.projectId,
      submissionUrl: sub.submissionUrl,
      submissionText: sub.submissionText,
      submissionFiles: sub.submissionFiles,
      status: sub.status,
      grade: sub.grade,
      feedback: sub.feedback,
      revisionCount: sub.revisionCount,
      submittedAt: sub.submittedAt,
      reviewedAt: sub.reviewedAt,
      student: {
        id: sub.student_id,
        name: sub.student_name,
        email: sub.student_email,
        image: sub.student_image
      }
    }));

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error('Error fetching project submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project submissions' },
      { status: 500 }
    );
  }
}
