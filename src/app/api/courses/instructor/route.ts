import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface CourseWithCount {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublished: boolean;
  isPrivate: boolean;
  price: number | null;
  difficulty: string;
  language: string | null;
  requirements: string | null;
  learningOutcomes: string | null;
  targetAudience: string | null;
  tags: string | null;
  instructorId: number;
  createdAt: Date;
  updatedAt: Date;
  shortDescription: string | null;
  discountedPrice: number | null;
  hasCertification: boolean;
  certificationRequirements: string | null;
  _count: {
    enrollments: number;
  };
}

// GET handler to fetch instructor's courses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ensure we have a valid user ID
    const instructorId = session.user.id;
    if (!instructorId) {
      return new NextResponse('User ID not found in session', { status: 400 });
    }

    const courses = await prisma.course.findMany({
      where: {
        instructorId: instructorId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }) as unknown as (CourseWithCount & { _count: { enrollments: number } })[];

    // Format the response to match the frontend's expected format
    const formattedCourses = courses.map(course => {
      // Map the status to match the frontend's expected values
      let publishStatus: 'draft' | 'published' | 'archived' = 'draft';
      if (course.status === 'PUBLISHED') publishStatus = 'published';
      if (course.status === 'ARCHIVED') publishStatus = 'archived';
      
      return {
        id: course.id,
        title: course.title,
        description: course.description || '',
        coverImage: course.imageUrl || '/images/course-placeholder.jpg',
        publishStatus,
        enrollmentCount: course._count.enrollments,
        lastUpdated: course.updatedAt.toISOString(),
        progress: 0 // Default progress for now
      };
    });

    return NextResponse.json({ courses: formattedCourses });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


// POST handler to create a new course
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    console.log('Starting course creation...');
    const formData = await req.formData();
    
    // Extract form data with validation
    const title = (formData.get('title') as string)?.trim();
    if (!title) {
      return NextResponse.json(
        { error: 'Course title is required' }, 
        { status: 400 }
      );
    }

    const isDraft = formData.get('isDraft') === 'true';
    const description = (formData.get('description') as string)?.trim() || 'No description provided';
    const shortDescription = (formData.get('shortDescription') as string)?.trim() || description.substring(0, 150);
    const category = (formData.get('category') as string) || 'Other';
    const level = (formData.get('level') as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') || 'BEGINNER';
    const language = (formData.get('language') as string) || 'English';
    
    // Parse price with validation
    let price = 0;
    const priceStr = formData.get('price') as string;
    if (priceStr) {
      const parsedPrice = parseFloat(priceStr);
      if (!isNaN(parsedPrice) && parsedPrice >= 0) {
        price = parsedPrice;
      }
    }
    
    const isFree = formData.get('isFree') === 'true' || price === 0;
    const hasDiscount = formData.get('hasDiscount') === 'true';
    
    // Parse discounted price with validation
    let discountedPrice: number | null = null;
    if (hasDiscount) {
      const discountStr = formData.get('discountedPrice') as string;
      if (discountStr) {
        const parsedDiscount = parseFloat(discountStr);
        if (!isNaN(parsedDiscount) && parsedDiscount >= 0) {
          discountedPrice = parsedDiscount;
        }
      }
    }
    
    // Parse arrays with better error handling
    const parseJsonArray = (value: FormDataEntryValue | null): string[] => {
      if (!value) return [];
      try {
        const parsed = JSON.parse(value as string);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed to parse JSON array:', value);
        return [];
      }
    };
    
    const requirements = parseJsonArray(formData.get('requirements')) || ['No specific requirements'];
    const learningOutcomes = parseJsonArray(formData.get('learningOutcomes')) || ['Gain valuable knowledge and skills'];
    const targetAudience = parseJsonArray(formData.get('targetAudience')) || ['Anyone interested in learning'];
    
    const isPublished = formData.get('isPublished') === 'true' && !isDraft;
    const isPrivate = formData.get('isPrivate') === 'true';
    
    // Set status based on isDraft and isPublished
    const status = isPublished ? 'PUBLISHED' : 'DRAFT';

    console.log('Creating course with data:', {
      title,
      isDraft,
      isPublished,
      isPrivate,
      price,
      isFree,
      hasDiscount,
      discountedPrice,
      language,
      level,
      category,
    });

    // Handle image upload (placeholder for actual implementation)
    // TODO: Implement actual image upload to your storage service

    // Prepare course data
    const courseData = {
      title,
      description: description || '',
      shortDescription: shortDescription || '',
      difficulty: level,
      status,
      isPublished: status === 'PUBLISHED',
      isPrivate,
      price: isFree ? 0 : price,
      discountedPrice: hasDiscount && discountedPrice !== null ? discountedPrice : null,
      language: language || 'English',
      requirements: JSON.stringify(requirements),
      learningOutcomes: JSON.stringify(learningOutcomes),
      targetAudience: JSON.stringify(targetAudience),
      tags: category,
      hasCertification: false,
      certificationRequirements: null,
      imageUrl: '/images/course-placeholder.jpg',
    };

    // Create the course with the instructor relation
    const course = await prisma.course.create({
      data: {
        ...courseData,
        instructor: {
          connect: {
            id: parseInt(session.user.id as string, 10)
          }
        }
      },
    });
    
    try {
      // Then create the default section using a raw query
      await prisma.$executeRaw`
        INSERT INTO "CourseSection" (id, title, description, "order", "courseId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Getting Started', 'Introduction to the course', 1, ${course.id}, datetime('now'), datetime('now'))
      `;
    } catch (sectionError) {
      console.error('Error creating default section:', sectionError);
      // Continue even if section creation fails
    }

    console.log('Course created successfully:', course.id);

    // Format the created course to match the frontend's expected format
    const formattedCourse = {
      id: course.id,
      title: course.title,
      description: course.description || '',
      coverImage: course.imageUrl || '/images/course-placeholder.jpg',
      publishStatus: (isDraft ? 'draft' : isPublished ? 'published' : 'draft') as 'draft' | 'published' | 'archived',
      enrollmentCount: 0,
      lastUpdated: new Date().toISOString(),
      progress: 0
    };

    // Return the course in the same format as the GET endpoint
    return NextResponse.json({ 
      courses: [formattedCourse] 
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating course:', error);
    
    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A course with this title already exists' }, 
        { status: 409 }
      );
    }
    
    // Log the full error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', error);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create course. Please try again.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }, 
      { status: 500 }
    );
  }
}
