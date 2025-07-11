import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/assessments - Get rubric assessments (filtered by submission, evaluator, or rubric)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const submissionId = url.searchParams.get('submissionId');
    const rubricId = url.searchParams.get('rubricId');
    const evaluatorId = url.searchParams.get('evaluatorId');
    
    let assessments = [];
    let where: any = {};
    
    // Build filter conditions
    if (submissionId) where.submissionId = submissionId;
    if (rubricId) where.rubricId = rubricId;
    if (evaluatorId) where.evaluatorId = evaluatorId;
    
    // Authorization checks depend on what we're filtering by
    if (submissionId) {
      // Check if user has access to this submission
      const submission = await prisma.projectSubmission.findUnique({
        where: { id: submissionId },
        include: {
          student: {
            select: {
              id: true,
            },
          },
          project: {
            include: {
              course: {
                include: {
                  instructor: {
                    select: {
                      id: true,
                    },
                  },
                  mentors: {
                    select: {
                      userId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      
      if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }
      
      // Determine access based on role
      const isStudent = session.user.id === submission.studentId;
      const isInstructor = session.user.id === submission.project.course.instructor.id;
      const isMentor = submission.project.course.mentors.some(m => m.userId === session.user.id);
      
      if (!isStudent && !isInstructor && !isMentor) {
        return NextResponse.json(
          { error: 'You do not have permission to view assessments for this submission' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'Student') {
      // Students can only see assessments for their own submissions
      where.submission = {
        studentId: session.user.id,
      };
    } else if (session.user.role !== 'Instructor' && session.user.role !== 'Mentor') {
      return NextResponse.json(
        { error: 'You do not have permission to view assessments' },
        { status: 403 }
      );
    }
    
    // Get the assessments
    assessments = await prisma.rubricAssessment.findMany({
      where,
      include: {
        rubric: {
          select: {
            title: true,
            description: true,
            maxPoints: true,
          },
        },
        criteria: {
          include: {
            criterion: true,
            level: true,
          },
        },
        submission: {
          select: {
            id: true,
            projectId: true,
            studentId: true,
            status: true,
            student: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

// POST /api/assessments - Create a new assessment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and mentors can create assessments
    if (session.user.role !== 'Instructor' && session.user.role !== 'Mentor') {
      return NextResponse.json(
        { error: 'Only instructors and mentors can create assessments' },
        { status: 403 }
      );
    }
    
    const data = await req.json();
    const { rubricId, submissionId, criteriaAssessments, feedback } = data;
    
    if (!rubricId) {
      return NextResponse.json({ error: 'Rubric ID is required' }, { status: 400 });
    }
    
    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }
    
    if (!criteriaAssessments || !Array.isArray(criteriaAssessments) || criteriaAssessments.length === 0) {
      return NextResponse.json({ error: 'Criteria assessments are required' }, { status: 400 });
    }
    
    // Verify the submission exists and user has access to it
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      include: {
        project: {
          include: {
            course: {
              include: {
                instructor: {
                  select: {
                    id: true,
                  },
                },
                mentors: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    // Check if user is instructor or mentor for this course
    const isInstructor = session.user.id === submission.project.course.instructor.id;
    const isMentor = submission.project.course.mentors.some(m => m.userId === session.user.id);
    
    if (!isInstructor && !isMentor) {
      return NextResponse.json(
        { error: 'You do not have permission to assess this submission' },
        { status: 403 }
      );
    }
    
    // Verify the rubric exists
    const rubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        criteria: {
          include: {
            levels: true,
          },
        },
      },
    });
    
    if (!rubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }
    
    // Validate that all criteria in the rubric have been assessed
    const criteriaIds = rubric.criteria.map(c => c.id);
    const assessedCriteriaIds = criteriaAssessments.map((ca: any) => ca.criterionId);
    
    const missingCriteria = criteriaIds.filter(id => !assessedCriteriaIds.includes(id));
    
    if (missingCriteria.length > 0) {
      return NextResponse.json(
        { error: 'All criteria must be assessed', missingCriteria },
        { status: 400 }
      );
    }
    
    // Calculate total score
    let totalScore = 0;
    for (const ca of criteriaAssessments) {
      const criterion = rubric.criteria.find(c => c.id === ca.criterionId);
      if (!criterion) continue;
      
      const level = criterion.levels.find(l => l.id === ca.levelId);
      if (!level) continue;
      
      totalScore += level.points * criterion.weight;
    }
    
    // Check if an assessment already exists for this submission by this evaluator
    const existingAssessment = await prisma.rubricAssessment.findFirst({
      where: {
        rubricId,
        submissionId,
        evaluatorId: session.user.id,
      },
    });
    
    let assessment;
    
    if (existingAssessment) {
      // Update existing assessment
      assessment = await prisma.$transaction(async (tx) => {
        // Delete existing criteria assessments
        await tx.criterionAssessment.deleteMany({
          where: { assessmentId: existingAssessment.id },
        });
        
        // Update the assessment
        const updated = await tx.rubricAssessment.update({
          where: { id: existingAssessment.id },
          data: {
            totalScore,
            percentage: (totalScore / rubric.maxPoints) * 100,
            feedback: feedback || '',
          },
        });
        
        // Create new criteria assessments
        for (const ca of criteriaAssessments) {
          const criterion = rubric.criteria.find(c => c.id === ca.criterionId);
          if (!criterion) continue;
          
          const level = criterion.levels.find(l => l.id === ca.levelId);
          if (!level) continue;
          
          await tx.criterionAssessment.create({
            data: {
              assessmentId: updated.id,
              criterionId: ca.criterionId,
              levelId: ca.levelId,
              score: level.points * criterion.weight,
              maxScore: Math.max(...criterion.levels.map(l => l.points)) * criterion.weight,
              comment: ca.comment || '',
            },
          });
        }
        
        // Return the updated assessment with all relations
        return tx.rubricAssessment.findUnique({
          where: { id: updated.id },
          include: {
            criteria: {
              include: {
                criterion: true,
                level: true,
              },
            },
          },
        });
      });
    } else {
      // Create new assessment
      assessment = await prisma.$transaction(async (tx) => {
        // Create the assessment
        const created = await tx.rubricAssessment.create({
          data: {
            rubricId,
            submissionId,
            evaluatorId: session.user.id,
            totalScore,
            maxScore: rubric.maxPoints,
            percentage: (totalScore / rubric.maxPoints) * 100,
            feedback: feedback || '',
          },
        });
        
        // Create criteria assessments
        for (const ca of criteriaAssessments) {
          const criterion = rubric.criteria.find(c => c.id === ca.criterionId);
          if (!criterion) continue;
          
          const level = criterion.levels.find(l => l.id === ca.levelId);
          if (!level) continue;
          
          await tx.criterionAssessment.create({
            data: {
              assessmentId: created.id,
              criterionId: ca.criterionId,
              levelId: ca.levelId,
              score: level.points * criterion.weight,
              maxScore: Math.max(...criterion.levels.map(l => l.points)) * criterion.weight,
              comment: ca.comment || '',
            },
          });
        }
        
        // Return the created assessment with all relations
        return tx.rubricAssessment.findUnique({
          where: { id: created.id },
          include: {
            criteria: {
              include: {
                criterion: true,
                level: true,
              },
            },
          },
        });
      });
      
      // Update the submission status if it's not already approved
      if (submission.status !== 'APPROVED') {
        await prisma.projectSubmission.update({
          where: { id: submissionId },
          data: {
            status: 'REVIEWED',
          },
        });
        
        // Create a notification for the student
        await prisma.notification.create({
          data: {
            userId: submission.studentId,
            type: 'ASSESSMENT',
            title: 'Your project has been assessed',
            message: `Your submission for ${submission.project.title} has been assessed.`,
            relatedId: assessment.id,
            relatedType: 'ASSESSMENT',
          },
        });
      }
    }
    
    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}
