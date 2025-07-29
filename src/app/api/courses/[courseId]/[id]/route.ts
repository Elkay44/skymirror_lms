import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Define interfaces for course data types
interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration?: number;
  isLocked: boolean;
  resources?: any[];
  lessons: Array<{
    id: string;
    title: string;
    description?: string;
    duration?: number;
    completed: boolean;
    order: number;
    videoUrl?: string;
    content?: string;
  }>;
  firstLessonId?: string;
}

interface CourseStudent {
  id: string;
  name: string;
  email: string;
  studentProfile?: {
    bio?: string;
    learningGoals?: string;
    interests?: string;
    goals?: string;
    preferredLearningStyle?: string;
  };
}

export async function GET(req: NextRequest, { params }: { params: { courseId: string; id: string } }, context: { params: { courseId: string; id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Get the course ID from params
    const courseId = params.courseId;

    // Build the where clause based on user role
    const whereClause: any = { id: params.courseId };
    
    // For non-authenticated users or regular students, only show published courses
    if (!session?.user?.role || session.user.role === 'STUDENT') {
      whereClause.isPublished = true;
    } else if (session.user.role === 'INSTRUCTOR') {
      // For instructors, show their own courses regardless of published status, but only published courses from others
      whereClause.OR = [
        { instructorId: session.user.id },
        { isPublished: true }
      ];
    }

    // Fetch the course with all necessary relations
    const course = await prisma.course.findUnique({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        shortDescription: true,
        image: true,
        thumbnail: true,
        level: true,
        category: true,
        isPublished: true,
        price: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            mentorProfile: {
              select: {
                bio: true,
                specialties: true,
                experience: true,
                availability: true,
                isActive: true
              }
            }
          }
        },
        enrolledStudents: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: {
              select: {
                bio: true,
                learningGoals: true,
                interests: true,
                goals: true,
                preferredLearningStyle: true
              }
            }
          }
        },
        modules: {
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            duration: true,
            isLocked: true,
            resources: true,
            lessons: {
              select: {
                id: true,
                title: true,
                description: true,
                duration: true,
                completed: true,
                order: true,
                videoUrl: true,
                content: true
              },
              orderBy: { order: 'asc' }
            },
            firstLessonId: true
          },
          orderBy: { order: 'asc' }
        },
        projects: {
          select: {
            id: true,
            title: true,
            description: true,
            completed: true,
            status: true,
            progress: true,
            dueDate: true,
            grade: true,
            tags: true,
            resources: true
          }
        },
        activities: {
          select: {
            id: true,
            type: true,
            title: true,
            timestamp: true,
            moduleTitle: true,
            grade: true
          }
        },
        startDate: true,
        endDate: true,
        progress: true,
        enrollmentStatus: true
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the frontend expectations
    const transformedCourse = {
      id: course.id,
      title: course.title,
      description: course.description || '',
      instructor: {
        id: course.instructor.id,
        name: course.instructor.name,
        email: course.instructor.email,
        image: course.instructor.image,
        bio: course.instructor.mentorProfile?.bio || '',
        specialties: course.instructor.mentorProfile?.specialties?.split(',') || [],
        experience: course.instructor.mentorProfile?.experience || '',
        availability: course.instructor.mentorProfile?.availability || '',
        isActive: course.instructor.mentorProfile?.isActive || false
      },
      thumbnailUrl: course.thumbnail || course.image || '',
      duration: course.modules.reduce((total: number, module: CourseModule) => {
        return total + (module.duration || 0);
      }, 0),
      level: course.level,
      category: course.category || 'Uncategorized',
      isPublished: course.isPublished,
      progress: course.progress || 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      isEnrolled: course.enrollmentStatus === 'ENROLLED',
      enrollmentStatus: course.enrollmentStatus || 'NOT_ENROLLED',
      enrolledStudents: course.enrolledStudents.map((student: CourseStudent) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        bio: student.studentProfile?.bio || '',
        learningGoals: student.studentProfile?.learningGoals || '',
        interests: student.studentProfile?.interests || '',
        goals: student.studentProfile?.goals || '',
        preferredLearningStyle: student.studentProfile?.preferredLearningStyle || ''
      })),
      modules: course.modules.map((module: CourseModule) => ({
        id: module.id,
        title: module.title,
        description: module.description || '',
        order: module.order,
        progress: module.lessons.reduce((total: number, lesson: CourseModule['lessons'][0]) => {
          return total + (lesson.completed ? 1 : 0);
        }, 0) / module.lessons.length * 100,
        isLocked: module.isLocked,
        duration: module.duration || 0,
        resources: module.resources || [],
        lessons: module.lessons.map((lesson: CourseModule['lessons'][0]) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          completed: lesson.completed,
          duration: lesson.duration || 0,
          order: lesson.order,
          videoUrl: lesson.videoUrl,
          content: lesson.content || ''
        })),
        firstLessonId: module.firstLessonId
      })),
      projects: course.projects || [],
      activities: course.activities || [],
      startDate: course.startDate,
      endDate: course.endDate
    };

    return NextResponse.json(transformedCourse);

  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course', message: (error as Error).message },
      { status: 500 }
    );
  }
}
