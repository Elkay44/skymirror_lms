import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { courseUpdateSchema } from "@/lib/validations/course";
import { logCourseActivity, ActivityType } from "@/lib/activity-logger";

interface Progress {
  completed: boolean;
  createdAt: Date | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  duration: number | null;
  order: number;
  moduleId: string;
  completed: boolean;
  completedAt: Date | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface Instructor {
  id: string;
  name: string;
  image: string | null;
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  instructor: Instructor;
  modules: Module[];
  isEnrolled: boolean;
  enrollmentStatus: string | undefined;
}

interface Progress {
  completed: boolean;
  createdAt: Date | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  duration: number | null;
  order: number;
  moduleId: string;
  completed: boolean;
  completedAt: Date | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface Instructor {
  id: string;
  name: string;
  image: string | null;
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  instructor: Instructor;
  modules: Module[];
  isEnrolled: boolean;
  enrollmentStatus: string | undefined;
}
import { revalidatePath } from 'next/cache';

interface TransformedLesson extends Omit<Lesson, 'duration'> {
  duration: number | null;
  formattedDuration: string;
}

interface Progress {
  completed: boolean;
  createdAt: Date | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  duration: number | null;
  order: number;
  moduleId: string;
  completed: boolean;
  completedAt: Date | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface Instructor {
  id: string;
  name: string;
  image: string | null;
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  instructor: Instructor;
  modules: Module[];
  isEnrolled: boolean;
  enrollmentStatus: string | undefined;
}

interface CourseWithInstructor {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  status?: string;
  instructor: {
    id: number;
    name: string | null;
    image: string | null;
  };
  instructorId: number;
  approvalHistory?: Array<{
    id: string;
    action: string;
    comments?: string | null;
    createdAt: Date;
    reviewer?: {
      id: number;
      name: string | null;
      image?: string | null;
    } | null;
  }>;
}

interface CourseWithDetails extends CourseWithInstructor {
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      content: string | null;
      videoUrl: string | null;
      duration: number | null;
      order: number;
      moduleId: string;
      completed: boolean;
      completedAt: Date | null;
    }>;
  }>;
  enrollments?: Array<{
    id: string;
    status: string;
    enrolledAt: Date;
    completedAt: Date | null;
  }>;
  approvalHistory?: Array<{
    id: string;
    action: string;
    comments?: string | null;
    createdAt: Date;
    reviewer?: {
      id: number;
      name: string | null;
      image?: string | null;
    } | null;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
): Promise<NextResponse> {
  try {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userIdNum = userId ? parseInt(userId) : undefined;

    if (!userIdNum) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // First check if course exists
    const courseExists = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true }
    });

    if (!courseExists) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Then fetch the full course with all includes
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: true,
        modules: {
          include: {
            lessons: {
              include: {
                progress: {
                  where: {
                    userId: userIdNum,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        enrollments: {
          where: {
            userId: userIdNum,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Failed to fetch course details' },
        { status: 500 }
      );
    }

    const transformedCourse: CourseDetails = {
      id: course.id,
      title: course.title,
      description: course.description || '',
      imageUrl: course.imageUrl || '',
      instructor: {
        id: course.instructorId.toString(),
        name: course.instructor?.name || '',
        image: course.instructor?.image || '',
      },
      modules: course.modules?.map((module): Module => ({
        id: module.id,
        title: module.title,
        description: module.description || '',
        order: module.order,
        lessons: module.lessons.map((lesson): TransformedLesson => {
          const progress = lesson.progress?.[0] || { completed: false, createdAt: null };
          return {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description || '',
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            duration: lesson.duration,
            formattedDuration: lesson.duration ? `${Math.floor(Number(lesson.duration) / 60)}m ${Math.floor(Number(lesson.duration) % 60)}s` : '0m 0s',
            order: lesson.order,
            moduleId: module.id,
            completed: progress.completed,
            completedAt: progress.createdAt,
          };
        }),
      })),
      isEnrolled: course.enrollments?.length > 0,
      enrollmentStatus: course.enrollments?.[0]?.status || undefined,
    };

    return NextResponse.json(transformedCourse);
  } catch (error: unknown) {
    console.error('Course fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course details' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId] - Update a specific course
export async function PATCH(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to update a course' },
        { status: 401 }
      );
    }
    
    const userIdNum = Number(session.user.id);
    
    // Check if the course exists and if the current user is the instructor
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { id: true } },
        // Using type assertion to work around schema mismatch
        ...(true as any && {
          approvalHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        })
      } as any,
    }) as (CourseWithInstructor & { approvalHistory: Array<{ action: string }> }) | null;

    // If course doesn't exist, return 404
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if the user is the instructor of this course
    const isInstructor = course.instructor.id === userIdNum;
    
    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: { role: true }
    });
    
    const isAdmin = user?.role === 'ADMIN';
    
    // Only instructors or admins can update courses
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this course' },
        { status: 403 }
      );
    }

    // Check if the course is under review or has changes requested
    const currentStatus = course.status || 'DRAFT';
    const latestApprovalAction = course.approvalHistory && course.approvalHistory.length > 0 ? course.approvalHistory[0].action : null;
    
    // Only admins can update courses under review, unless it's in CHANGES_REQUESTED status
    if (currentStatus === 'UNDER_REVIEW' && !isAdmin && latestApprovalAction !== 'CHANGES_REQUESTED') {
      return NextResponse.json({
        error: 'Course is currently under review and cannot be modified',
        details: 'Please wait until the review process is complete or the reviewer requests changes.'
      }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = courseUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid course data provided',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }
    
    const updateData = validationResult.data;
    
    // Process the data - handle special fields like JSON arrays that need to be stored as strings
    const processedData: any = {};
    
    // Copy non-array fields directly
    Object.keys(updateData).forEach(key => {
      if (key !== 'requirements' && key !== 'learningOutcomes' && key !== 'targetAudience' && key !== 'submitForReview') {
        processedData[key] = (updateData as any)[key];
      }
    });
    
    // Handle array fields that need to be stored as JSON strings
    if (updateData.requirements) {
      processedData.requirements = JSON.stringify(updateData.requirements);
    }
    if (updateData.learningOutcomes) {
      processedData.learningOutcomes = JSON.stringify(updateData.learningOutcomes);
    }
    if (updateData.targetAudience) {
      processedData.targetAudience = JSON.stringify(updateData.targetAudience);
    }
    
    // Handle approval workflow
    const submitForReview = (updateData as any).submitForReview === true;
    let approvalHistoryEntry = null;
    
    // Determine the appropriate status
    if (isInstructor && submitForReview) {
      // If instructor is submitting for review, change status to PENDING
      processedData.status = 'PENDING';
      approvalHistoryEntry = {
        action: 'SUBMITTED',
        comments: (updateData as any).submissionComments || null
      };
    } else if (isAdmin && (updateData as any).approvalAction) {
      // If admin is taking an approval action
      const approvalAction = (updateData as any).approvalAction;
      
      if (approvalAction === 'APPROVED') {
        processedData.status = 'APPROVED';
        processedData.isPublished = true;
        approvalHistoryEntry = {
          action: 'APPROVED',
          comments: (updateData as any).approvalComments || null,
          reviewerId: userIdNum
        };
      } else if (approvalAction === 'REJECTED') {
        processedData.status = 'DRAFT'; // Return to draft when rejected
        approvalHistoryEntry = {
          action: 'REJECTED',
          comments: (updateData as any).approvalComments || null,
          reviewerId: userIdNum
        };
      } else if (approvalAction === 'CHANGES_REQUESTED') {
        processedData.status = 'DRAFT';
        approvalHistoryEntry = {
          action: 'CHANGES_REQUESTED',
          comments: (updateData as any).approvalComments || null,
          reviewerId: userIdNum
        };
      }
    } else if (updateData.isPublished === true && isAdmin) {
      // If admin directly publishes without approval flow
      processedData.status = 'APPROVED';
      processedData.isPublished = true;
    }
    
    // Use a transaction to ensure that both course update and approval history creation succeed
    const result = await prisma.$transaction(async (tx) => {
      // Update the course
      const updatedCourse = await tx.course.update({
        where: { id: courseId },
        data: processedData,
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          }
        },
      });

      // Create approval history entry if needed
      if (approvalHistoryEntry) {
        await tx.courseApprovalHistory.create({
          data: {
            courseId,
            action: approvalHistoryEntry.action,
            comments: approvalHistoryEntry.comments,
            reviewerId: approvalHistoryEntry.reviewerId,
          },
        });

        // Log course activity
        const activityType = 
          approvalHistoryEntry.action === 'SUBMITTED' ? 'course.submitted_for_review' :
          approvalHistoryEntry.action === 'APPROVED' ? 'course.approved' :
          approvalHistoryEntry.action === 'REJECTED' ? 'course.rejected' : 'course.changes_requested';

        await logCourseActivity(prisma, {
          userId: userIdNum,
          courseId,
          type: activityType as ActivityType,
          details: approvalHistoryEntry.comments ? { comments: approvalHistoryEntry.comments } : undefined
        });
      }
      
      return updatedCourse;
    });
    
    // Invalidate cache by revalidating paths
    revalidatePath(`/api/courses/${courseId}`);
    revalidatePath(`/api/courses`);

    return NextResponse.json({
      message: 'Course updated successfully',
      course: result
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId] - Delete a specific course
export async function DELETE(request: Request, { params }: { params: { courseId: string } }) {
  try {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to delete a course' },
        { status: 401 }
      );
    }
    
    const userIdNum = Number(session.user.id);
    
    // Check if the course exists and if the current user is the instructor
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { id: true } },
      },
    }) as CourseWithInstructor | null;

    // If course doesn't exist, return 404
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if the user is the instructor of this course
    const isInstructor = course.instructor.id === userIdNum;
    
    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: { role: true }
    });
    
    const isAdmin = user?.role === 'ADMIN';
    
    // Only instructors or admins can delete courses
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this course' },
        { status: 403 }
      );
    }

    // Check if there are any active enrollments for this course
    const enrollments = await prisma.enrollment.count({
      where: {
        courseId,
        status: 'ACTIVE'
      }
    });
    
    // If there are active enrollments, don't allow deletion but offer archiving instead
    if (enrollments > 0 && !isAdmin) {
      return NextResponse.json(
        {
          error: 'Course has active enrollments and cannot be deleted',
          suggestion: 'Consider archiving the course instead by updating its status to ARCHIVED',
          activeEnrollments: enrollments
        },
        { status: 400 }
      );
    }
    
    // Perform the deletion - for admins, this will delete the course even with active enrollments
    // For instructors with no active enrollments, this will also delete the course
    await prisma.course.delete({
      where: { id: courseId }
    });

    return NextResponse.json({
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
