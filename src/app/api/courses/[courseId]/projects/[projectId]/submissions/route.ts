import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; projectId: string }> }
) {
  const { courseId, projectId } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify the course belongs to this instructor
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        instructorId: userId 
      },
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or you do not have access to it' },
        { status: 404 }
      );
    }

    // Verify the project belongs to this course
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        courseId: courseId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get all submissions for this project
    const submissions = await prisma.projectSubmission.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            pointsValue: true,
          },
        },
        marks: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    // Get code commits for this project
    const commits = await (prisma as any).codeCommit.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        commitDate: 'desc',
      },
    });

    // Format the response data
    const submissionsWithDetails = submissions.map((submission) => {
      const latestMark = submission.marks[0]; // Get the latest mark if any
      const studentCommits = commits.filter((commit: any) => commit.studentId === submission.studentId);
      
      return {
        id: submission.id,
        student: {
          id: submission.student.id,
          name: submission.student.name,
          email: submission.student.email,
          image: submission.student.image,
        },
        project: submission.project,
        submissionUrl: submission.submissionUrl,
        submissionText: submission.submissionText,
        submissionFiles: submission.submissionFiles ? JSON.parse(submission.submissionFiles) : null,
        status: submission.status,
        grade: submission.grade,
        feedback: submission.feedback,
        submittedAt: submission.submittedAt.toISOString(),
        reviewedAt: submission.reviewedAt?.toISOString(),
        revisionCount: submission.revisionCount,
        // Mark information
        mark: latestMark ? {
          id: latestMark.id,
          grade: latestMark.grade,
          letterGrade: latestMark.letterGrade,
          feedback: latestMark.feedback,
          markedBy: latestMark.instructor.name,
          markedAt: latestMark.markedAt.toISOString(),
        } : null,
        // Commit information
        commits: studentCommits.map((commit: any) => ({
          id: commit.id,
          commitHash: commit.commitHash,
          message: commit.message,
          branch: commit.branch,
          repositoryUrl: commit.repositoryUrl,
          filesChanged: commit.filesChanged,
          linesAdded: commit.linesAdded,
          linesDeleted: commit.linesDeleted,
          commitDate: commit.commitDate.toISOString(),
        })),
        totalCommits: studentCommits.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          pointsValue: project.pointsValue,
        },
        submissions: submissionsWithDetails,
        totalSubmissions: submissionsWithDetails.length,
      },
    });
  } catch (error) {
    console.error('Error fetching project submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project submissions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; projectId: string }> }
) {
  const { courseId, projectId } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Verify the course belongs to this instructor
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        instructorId: userId 
      },
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or you do not have access to it' },
        { status: 404 }
      );
    }

    // Verify the project belongs to this course
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        courseId: courseId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const { submissionId, grade, letterGrade, feedback, rubricScores } = body;

    // Verify the submission exists
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      include: { student: true },
    });

    if (!submission || submission.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Create or update the project mark
    const mark = await (prisma as any).projectMark.upsert({
      where: {
        projectId_studentId: {
          projectId: projectId,
          studentId: submission.studentId,
        },
      },
      update: {
        grade: parseFloat(grade),
        letterGrade,
        feedback,
        rubricScores: rubricScores ? JSON.stringify(rubricScores) : null,
        markedBy: userId,
        markedAt: new Date(),
      },
      create: {
        projectId: projectId,
        studentId: submission.studentId,
        submissionId: submissionId,
        grade: parseFloat(grade),
        letterGrade,
        feedback,
        rubricScores: rubricScores ? JSON.stringify(rubricScores) : null,
        markedBy: userId,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update the submission status and grade
    await prisma.projectSubmission.update({
      where: { id: submissionId },
      data: {
        grade: Math.round(parseFloat(grade)),
        status: 'GRADED',
        reviewedAt: new Date(),
        reviewerId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Project marked successfully',
      data: {
        id: mark.id,
        grade: mark.grade,
        letterGrade: mark.letterGrade,
        feedback: mark.feedback,
        markedBy: mark.instructor.name,
        markedAt: mark.markedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error marking project:', error);
    return NextResponse.json(
      { error: 'Failed to mark project' },
      { status: 500 }
    );
  }
}
