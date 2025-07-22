/* eslint-disable */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/courses/instructor/[courseId] - Get a specific course for instructor editing
export async function GET(
  request: Request, 
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const url = new URL(request.url);
    const isDevMode = process.env.NODE_ENV === 'development' && url.searchParams.get('dev') === 'true';

    // Check if the user is logged in (skip in dev mode with dev param)
    if (!userId && !isDevMode) {
      return NextResponse.json(
        { error: 'You must be logged in to edit a course' },
        { status: 401 }
      );
    }
    
    // In dev mode with dev param, use a fake userId for testing
    const effectiveUserId = userId || (isDevMode ? '1' : undefined);

    // Find the course including only the fields needed for editing
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { id: true } },
        modules: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              include: {
                quiz: {
                  include: {
                    questions: {
                      orderBy: { position: 'asc' },
                      include: {
                        options: {
                          orderBy: { position: 'asc' }
                        }
                      }
                    }
                  }
                }
              }
            },
            quizzes: {
              orderBy: { position: 'asc' },
              include: {
                questions: {
                  orderBy: { position: 'asc' },
                  include: {
                    options: {
                      orderBy: { position: 'asc' }
                    }
                  }
                }
              }
            }
          }
        },
        categories: true,
        requirements: true,
        whatYouWillLearn: true,
        whoIsThisFor: true
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if the user is the instructor of this course (skip in dev mode with dev param)
    if (course.instructor.id !== effectiveUserId && !isDevMode) {
      return NextResponse.json(
        { error: 'You are not authorized to edit this course' },
        { status: 403 }
      );
    }

    // Parse JSON array fields
    const parsedCourse = {
      ...course,
      requirements: parseJsonArray(course.requirements as any),
      whatYouWillLearn: parseJsonArray(course.whatYouWillLearn as any),
      whoIsThisFor: parseJsonArray(course.whoIsThisFor as any),
      price: course.price?.toNumber() || 0,
      discountPrice: course.discountPrice?.toNumber() || null,
      averageRating: course.averageRating?.toNumber() || 0,
      totalStudents: course.totalStudents || 0,
      totalLessons: course.totalLessons || 0,
      totalQuizzes: course.totalQuizzes || 0,
      totalDuration: course.totalDuration || 0,
      modules: course.modules.map((module: any) => ({
        ...module,
        position: Number(module.position) || 0,
        lessons: (module.lessons || []).map((lesson: any) => ({
          ...lesson,
          position: Number(lesson.position) || 0,
          duration: Number(lesson.duration) || 0,
          quiz: lesson.quiz ? {
            ...lesson.quiz,
            timeLimit: lesson.quiz.timeLimit ? Number(lesson.quiz.timeLimit) : null,
            passingScore: lesson.quiz.passingScore ? Number(lesson.quiz.passingScore) : 0,
            questions: (lesson.quiz.questions || []).map((q: any) => ({
              ...q,
              position: Number(q.position) || 0,
              points: Number(q.points) || 1,
              options: ((q.options as any[]) || []).map((o: any) => ({
                ...o,
                position: Number(o.position) || 0
              }))
            }))
          } : null
        })),
        quizzes: (module.quizzes || []).map((quiz: any) => ({
          ...quiz,
          position: Number(quiz.position) || 0,
          timeLimit: quiz.timeLimit ? Number(quiz.timeLimit) : null,
          passingScore: quiz.passingScore ? Number(quiz.passingScore) : 0,
          questions: (quiz.questions || []).map((q: any) => ({
            ...q,
            position: Number(q.position) || 0,
            points: Number(q.points) || 1,
            options: ((q.options as any[]) || []).map((o: any) => ({
              ...o,
              position: Number(o.position) || 0
            }))
          }))
        }))
      }))
    };

    return NextResponse.json(parsedCourse);
  } catch (error) {
    console.error('Error fetching course for editing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course for editing' },
      { status: 500 }
    );
  }
}

// Helper function to safely parse JSON array fields
function parseJsonArray(jsonString: string | null): string[] {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing JSON array:', error);
    return [];
  }
}

// PUT /api/courses/instructor/[courseId] - Update a specific course
export async function PUT(
  request: Request, 
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const url = new URL(request.url);
    const isDevMode = process.env.NODE_ENV === 'development' && url.searchParams.get('dev') === 'true';

    // Check if the user is logged in (skip in dev mode with dev param)
    if (!userId && !isDevMode) {
      return NextResponse.json(
        { error: 'You must be logged in to update a course' },
        { status: 401 }
      );
    }
    
    // In dev mode with dev param, use a fake userId for testing
    const effectiveUserId = userId || (isDevMode ? '1' : undefined);

    // Get the form data
    const formData = await request.formData();
    
    // Parse the form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const shortDescription = formData.get('shortDescription') as string;
    const price = formData.get('price') as string;
    const discountPrice = formData.get('discountPrice') as string;
    const level = formData.get('level') as string;
    const language = formData.get('language') as string;
    const categoryId = formData.get('categoryId') as string;
    const isPublished = formData.get('isPublished') === 'true';
    const isFeatured = formData.get('isFeatured') === 'true';
    const requirements = parseJsonArrayFromFormData(formData.get('requirements'));
    const whatYouWillLearn = parseJsonArrayFromFormData(formData.get('whatYouWillLearn'));
    const whoIsThisFor = parseJsonArrayFromFormData(formData.get('whoIsThisFor'));
    const thumbnail = formData.get('thumbnail') as string;
    const previewVideo = formData.get('previewVideo') as string;

    // Find the course to check permissions
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if the user is the instructor of this course (skip in dev mode with dev param)
    if (course.instructorId !== effectiveUserId && !isDevMode) {
      return NextResponse.json(
        { error: 'You are not authorized to update this course' },
        { status: 403 }
      );
    }

    // Update the course
    const updatedCourse = await (prisma as any).course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        price: Number(price) || 0,
        level,
        language,
        categoryId: categoryId || null,
        isPublished,
        isFeatured,
        requirements: JSON.stringify(requirements || []),
        whatYouWillLearn: JSON.stringify(whatYouWillLearn || []),
        whoIsThisFor: JSON.stringify(whoIsThisFor || []),
        thumbnail: thumbnail || null,
        previewVideo: previewVideo || null,
      },
      include: {
        instructor: { select: { id: true } },
        modules: {
          include: {
            lessons: true,
            quizzes: true
          }
        }
      }
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// Helper function to parse JSON arrays from form data
function parseJsonArrayFromFormData(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  
  try {
    if (typeof value === 'string') {
      // If it's already a string, try to parse it as JSON
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    }
    // If it's a File or other type, return empty array
    return [];
  } catch (error) {
    console.error('Error parsing JSON array from form data:', error);
    return [];
  }
}
