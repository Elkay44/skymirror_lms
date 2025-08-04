import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/courses/[courseId]/enroll - Enroll students (direct or invite)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify instructor access
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, title: true }
    });

    if (!course || course.instructorId !== userId) {
      return NextResponse.json(
        { error: 'You must be the instructor of this course to enroll students' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { type, students, message } = body;

    if (!type || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data. Type and students array are required.' },
        { status: 400 }
      );
    }

    const results: {
      success: Array<{ email: string; name: string; type: string }>;
      errors: Array<{ email: string; error: string }>;
      invites: Array<{ email: string; name: string; invitationId: string; type: string }>;
    } = {
      success: [],
      errors: [],
      invites: []
    };

    for (const studentData of students) {
      const { email, name } = studentData;
      
      if (!email) {
        results.errors.push({ email: email || 'unknown', error: 'Email is required' });
        continue;
      }

      try {
        if (type === 'direct') {
          // Direct enrollment - find or create user and enroll immediately
          let user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user) {
            // Create user if they don't exist
            user = await prisma.user.create({
              data: {
                email,
                name: name || email.split('@')[0],
                role: 'STUDENT'
              }
            });
          }

          // Check if already enrolled
          const existingEnrollment = await prisma.enrollment.findFirst({
            where: {
              userId: user.id,
              courseId
            }
          });

          if (existingEnrollment) {
            results.errors.push({ email, error: 'Student is already enrolled' });
            continue;
          }

          // Create enrollment
          await prisma.enrollment.create({
            data: {
              userId: user.id,
              courseId,
              status: 'ACTIVE',
              enrolledAt: new Date()
            }
          });

          results.success.push({ email, name: user.name || email.split('@')[0], type: 'enrolled' });

        } else if (type === 'invite') {
          // Invite enrollment - create invitation record
          
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email }
          });

          if (existingUser) {
            // Check if already enrolled
            const existingEnrollment = await prisma.enrollment.findFirst({
              where: {
                userId: existingUser.id,
                courseId
              }
            });

            if (existingEnrollment) {
              results.errors.push({ email, error: 'Student is already enrolled' });
              continue;
            }
          }

          // Create or update invitation
          const invitation = await prisma.courseInvitation.upsert({
            where: {
              email_courseId: {
                email,
                courseId
              }
            },
            update: {
              message: message || null,
              invitedAt: new Date(),
              status: 'PENDING'
            },
            create: {
              email,
              courseId,
              invitedBy: userId,
              message: message || null,
              status: 'PENDING'
            }
          });

          results.invites.push({ 
            email, 
            name: name || email.split('@')[0], 
            invitationId: invitation.id,
            type: 'invited'
          });

          // TODO: Send email invitation here
          // You can integrate with your email service (SendGrid, Nodemailer, etc.)
          
        }
      } catch (error) {
        console.error(`Error processing ${email}:`, error);
        results.errors.push({ 
          email, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${students.length} students. ${results.success.length} enrolled, ${results.invites.length} invited, ${results.errors.length} errors.`
    });

  } catch (error) {
    console.error('[COURSE_ENROLL_POST]', error);
    return NextResponse.json(
      { error: 'Failed to process enrollment' },
      { status: 500 }
    );
  }
}

// GET /api/courses/[courseId]/enroll - Get pending invitations
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify instructor access
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });

    if (!course || course.instructorId !== userId) {
      return NextResponse.json(
        { error: 'You must be the instructor of this course' },
        { status: 403 }
      );
    }

    // Get pending invitations
    const invitations = await prisma.courseInvitation.findMany({
      where: {
        courseId,
        status: 'PENDING'
      },
      include: {
        invitedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        invitedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      invitations
    });

  } catch (error) {
    console.error('[COURSE_ENROLL_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
