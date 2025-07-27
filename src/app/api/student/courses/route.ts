import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Define types for the database models
interface Progress {
  id: string;
  completed: boolean;
  userId: number;
  lessonId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration: number;
  completed: boolean;
  order: number;
  videoUrl?: string;
  content?: string;
  progress?: Progress[];
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
  isPublished?: boolean;
}

interface Instructor {
  id: number;
  name: string | null;
  email: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string | Instructor;
  thumbnailUrl?: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced' | string;
  category: string;
  modules: Module[];
  createdAt: string | Date;
  updatedAt: string | Date;
  isPublished?: boolean;
  imageUrl?: string | null;
  difficulty?: string;
}

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  difficulty: string;
  category: string;
  instructor: Instructor;
  modules: Module[];
  createdAt: Date;
  updatedAt: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);
    
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: userId,
        status: 'ENROLLED',
      },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                name: true,
              },
            },
            modules: {
              include: {
                lessons: {
                  include: {
                    progress: {
                      where: {
                        userId: userId,
                      },
                    } as const,
                  },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    const courses = await Promise.all(enrollments.map(async (enrollment) => {
      try {
        // First get the course with its instructor
        const course = await prisma.course.findUnique({
          where: { id: enrollment.courseId },
          include: {
            instructor: true,
          },
        });

        if (!course) return null;

        // Then get the modules and lessons with progress
        const modules = await prisma.module.findMany({
          where: { courseId: course.id },
          include: {
            lessons: {
              include: {
                progress: {
                  where: {
                    userId: userId,
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        });

        // Calculate total duration
        const totalDuration = modules.reduce((sum: number, module: Module) => {
          return sum + ((module.lessons || []).reduce((lessonSum: number, lesson: Lesson) => 
            lessonSum + (lesson.duration || 0), 0));
        }, 0);

        // Map the data to our Course type
        const courseWithModules = {
          ...course,
          modules: modules.map((module: Module) => ({
            ...module,
            lessons: (module.lessons || []).map((lesson: Lesson) => ({
              ...lesson,
              progress: lesson.progress || [],
            })),
          })),
        };

        // Helper function to safely get instructor name
        const getInstructorName = (instructor: string | Instructor | any): string => {
          if (!instructor) return 'Unknown Instructor';
          if (typeof instructor === 'string') return instructor;
          // Handle both Instructor type and the user object type
          return instructor.name || 'Unknown Instructor';
        };

        // Helper function to determine course level
        const getCourseLevel = (difficulty: string | undefined): 'beginner' | 'intermediate' | 'advanced' => {
          if (!difficulty) return 'beginner';
          const level = difficulty.toLowerCase();
          if (level === 'beginner' || level === 'intermediate' || level === 'advanced') {
            return level;
          }
          return 'beginner';
        };

        // Prepare course data with proper fallbacks
        const courseData = {
          id: course.id,
          title: course.title,
          description: course.description || '',
          instructor: getInstructorName(course.instructor),
          // Use course.imageUrl as the primary source, fall back to course.thumbnailUrl if available
          thumbnailUrl: 'imageUrl' in course ? course.imageUrl : 
                       'thumbnailUrl' in course ? (course as any).thumbnailUrl : undefined,
          duration: totalDuration,
          // Use difficulty if available, otherwise default to 'beginner'
          level: 'difficulty' in course ? getCourseLevel((course as any).difficulty) : 'beginner',
          category: 'category' in course ? (course as any).category : 'General',
          modules: courseWithModules.modules.map((module: Module) => ({
            id: module.id,
            title: module.title,
            description: module.description || undefined,
            order: module.order || 0,
            isPublished: 'isPublished' in module ? module.isPublished : true,
            lessons: (module.lessons || []).map((lesson: any) => ({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              duration: lesson.duration || 0,
              completed: (lesson.progress && lesson.progress.length > 0) 
                ? lesson.progress[0].completed 
                : (lesson.completed || false),
              order: lesson.order || 0,
              videoUrl: lesson.videoUrl,
              content: lesson.content
            }))
          })),
          createdAt: course.createdAt instanceof Date 
            ? course.createdAt.toISOString() 
            : new Date(course.createdAt).toISOString(),
          updatedAt: course.updatedAt instanceof Date 
            ? course.updatedAt.toISOString() 
            : new Date(course.updatedAt).toISOString(),
          isPublished: 'isPublished' in course ? (course as any).isPublished : true
        };

        // Add imageUrl if it exists
        if ('imageUrl' in course) {
          (courseData as any).imageUrl = course.imageUrl;
        }

        return courseData;
      } catch (error) {
        console.error(`Error processing course ${enrollment.courseId}:`, error);
        return null;
      }
    }));

    // Filter out any null courses and ensure we return an array
    const validCourses = courses.filter((course): course is NonNullable<typeof course> => course !== null);

    return NextResponse.json({ courses: validCourses });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
