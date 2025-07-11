import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { courseUpdateSchema } from '@/validations/course';
import { z } from 'zod';
import { logCourseActivity, ActivityAction } from '@/lib/activity-log';
import { revalidatePath } from 'next/cache';

interface CourseWithInstructor {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  status?: string;
  instructor: {
    id: number;
  };
  instructorId: number;
  approvalHistory?: Array<{
    id: string;
    action: string;
    comments?: string | null;
    createdAt: Date;
    reviewer?: {
      id: number;
      name: string;
      image?: string | null;
    } | null;
  }>;
}

interface CourseWithDetails extends CourseWithInstructor {
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    position: number;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      content: string | null;
      videoUrl: string | null;
      duration: number | null;
      position: number;
      progress?: Array<{
        completed: boolean;
        completedAt: Date | null;
      }>;
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
    reviewerId: number;
    reviewer?: {
      id: number;
      name: string;
      image?: string | null;
    } | null;
  }>;
}

// GET /api/courses/[courseId] - Get a specific course with all its details
export async function GET(request: Request, { params }: { params: { courseId: string } }) {
  try {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userIdNum = userId ? Number(userId) : undefined;

    // Check if the user is logged in
    if (!userIdNum) {
      return NextResponse.json(
        { error: 'You must be logged in to view course details' },
        { status: 401 }
      );
    }

    // First, check if the course exists and if the current user is the instructor
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

    // If not the instructor and course is not published, return 404
    if (!isInstructor && !course.isPublished) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Fetch the full course details with modules and lessons
    const isAdmin = session?.user?.role === 'ADMIN';
    const courseCheck = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });

    if (!courseCheck) {
      return NextResponse.json(
        {
          message: 'Course not found',
        },
        { status: 404 }
      );
    }
    
    // Check if current user is the instructor of this course
    // Convert IDs to strings for comparison since session.user.id might be a string
    const isInstructorOfCourse = courseCheck.instructorId.toString() === session?.user?.id?.toString();

    // For instructors, check if this is their course
    if (session?.user?.role === 'INSTRUCTOR' && !isInstructorOfCourse) {
      return NextResponse.json(
        { error: 'You do not have permission to view this course' },
        { status: 403 }
      );
    }

    // Now fetch the full course details
    const courseWithDetails = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        modules: {
          orderBy: {
            createdAt: 'asc', // Using createdAt instead of position
          },
          include: {
            lessons: {
              orderBy: {
                createdAt: 'asc', // Using createdAt instead of position
              },
              include: {
                progress: isInstructor ? false : {
                  where: {
                    userId: userIdNum
                  },
                  select: {
                    completed: true,
                    completedAt: true,
                  },
                },
              },
            },
          },
        },
        enrollments: isInstructor ? false : {
          where: {
            userId: userIdNum
          },
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            completedAt: true,
          },
        },
        ...(isAdmin || isInstructorOfCourse ? {
          approvalHistory: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        } : {})
      },
    }) as unknown as CourseWithDetails | null;

    if (!courseWithDetails) {
      return NextResponse.json(
        { error: 'Failed to load course details' },
        { status: 500 }
      );
    }

    // Check if the user is enrolled in this course or is the instructor
    const userEnrollments = 'enrollments' in courseWithDetails ? courseWithDetails.enrollments : [];
    const isEnrolled = Array.isArray(userEnrollments) ? userEnrollments.length > 0 : false;
    const userIsInstructor = courseWithDetails.instructor.id === userIdNum;

    // If not enrolled and not the instructor, return limited information
    if (!isEnrolled && !userIsInstructor) {
      // Return limited course info without content
      const limitedCourse = {
        id: courseWithDetails.id,
        title: courseWithDetails.title,
        description: courseWithDetails.description,
        imageUrl: courseWithDetails.imageUrl,
        instructor: courseWithDetails.instructor,
        isEnrolled: false,
        isInstructor: false,
        modules: [], // No access to modules if not enrolled
      };

      return NextResponse.json(limitedCourse);
    }

    // Transform the data to include progress information
    const baseCourse = {
      id: courseWithDetails.id,
      title: courseWithDetails.title,
      description: courseWithDetails.description,
      imageUrl: courseWithDetails.imageUrl,
      instructor: courseWithDetails.instructor,
      isEnrolled: isEnrolled,
      isInstructor: userIsInstructor,
    };

    // Add enrollment details if user is enrolled
    const enrollmentDetails = isEnrolled && Array.isArray(userEnrollments) && userEnrollments[0] ? {
      enrollmentStatus: userEnrollments[0].status,
      enrolledAt: userEnrollments[0].enrolledAt,
      completedAt: userEnrollments[0].completedAt,
    } : {};

    // Add modules and lessons if user is enrolled or is the instructor
    const modules = ('modules' in courseWithDetails && courseWithDetails.modules) ? 
      courseWithDetails.modules.map((module: any) => ({
        id: module.id,
        title: module.title,
        description: module.description || '',
        position: module.position || 0,
        lessons: (module.lessons || []).map((lesson: any) => {
          const progress = Array.isArray(lesson.progress) && lesson.progress[0] || null;
          return {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description || '',
            content: userIsInstructor || isEnrolled ? lesson.content || '' : '',
            videoUrl: userIsInstructor || isEnrolled ? lesson.videoUrl || '' : '',
            duration: lesson.duration ? `${lesson.duration} min` : 'Unknown',
            position: lesson.position || 0,
            moduleId: module.id,
            completed: progress?.completed || false,
            completedAt: progress?.completedAt,
          };
        }),
      })) : [];

    const transformedCourse = {
      ...baseCourse,
      ...enrollmentDetails,
      modules,
      ...(isAdmin || isInstructorOfCourse ? {
        approvalHistory: courseWithDetails.approvalHistory
      } : {})
    };

    // Add approval history if user is admin or the instructor
    const canManageCourse = isAdmin || isInstructorOfCourse;
    
    // We've already added approval history to transformedCourse above, so just return it
    return NextResponse.json(transformedCourse);
  } catch (error) {
    console.error('Error fetching course:', error);
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
      // If instructor is submitting for review, change status to UNDER_REVIEW
      processedData.status = 'UNDER_REVIEW';
      approvalHistoryEntry = {
        action: 'SUBMITTED',
        comments: (updateData as any).submissionComments || null
      };
    } else if (isAdmin && (updateData as any).approvalAction) {
      // If admin is taking an approval action
      const approvalAction = (updateData as any).approvalAction;
      
      if (approvalAction === 'APPROVED') {
        processedData.status = 'PUBLISHED';
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
        processedData.status = 'CHANGES_REQUESTED';
        approvalHistoryEntry = {
          action: 'CHANGES_REQUESTED',
          comments: (updateData as any).approvalComments || null,
          reviewerId: userIdNum
        };
      }
    } else if (updateData.isPublished === true && isAdmin) {
      // If admin directly publishes without approval flow
      processedData.status = 'PUBLISHED';
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
        // Use raw query approach instead of extension to avoid type errors
        await tx.$executeRaw`
          INSERT INTO "CourseApprovalHistory" (
            "id", "courseId", "action", "comments", "reviewerId", "createdAt"
          ) VALUES (
            uuid_generate_v4(),
            ${courseId},
            ${approvalHistoryEntry.action},
            ${approvalHistoryEntry.comments || null},
            ${'reviewerId' in approvalHistoryEntry ? approvalHistoryEntry.reviewerId : null},
            now()
          )
        `;
        
        // Log course activity
        const activityType = 
          approvalHistoryEntry.action === 'SUBMITTED' ? 'course.submitted_for_review' :
          approvalHistoryEntry.action === 'APPROVED' ? 'course.approved' :
          approvalHistoryEntry.action === 'REJECTED' ? 'course.rejected' : 'course.changes_requested';
        
        // Log course activity with the correct parameter structure
        await logCourseActivity(
          userIdNum,
          courseId,
          activityType as ActivityAction,
          approvalHistoryEntry.comments ? { comments: approvalHistoryEntry.comments } : undefined
        );
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
