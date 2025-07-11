import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/courses/instructor/[courseId] - Get a specific course for instructor editing
export async function GET(request: Request, { params }: { params: { courseId: string } }) {
  try {
    const { courseId } = params;
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
      },
    });

    // If course doesn't exist but we're in dev mode, create a mock course for testing
    if (!course && isDevMode) {
      console.log('Development mode: Using mock course data for ID:', courseId);
      
      // Create mock course data for development
      const mockCourse = {
        id: courseId,
        title: 'Sample Course for Development',
        shortDescription: 'This is a sample course created for development mode testing',
        description: 'This is a detailed description of the sample course. It includes mock data for testing the course edit form.',
        difficulty: 'INTERMEDIATE',
        tags: 'Development, Testing',
        language: 'en',
        isPublished: false,
        isPrivate: false,
        price: 29.99,
        discountedPrice: 19.99,
        requirements: JSON.stringify(['Basic programming knowledge', 'Familiarity with web development']),
        learningOutcomes: JSON.stringify(['Understand course editing', 'Test form functionality', 'Validate data flow']),
        targetAudience: JSON.stringify(['Developers', 'Testers', 'Quality Assurance']),
        imageUrl: '/images/course-placeholder.jpg',
        instructor: { id: 1 },
        promoVideoUrl: 'https://www.example.com/sample-video.mp4',
      };
      
      // No need to check instructor permissions for mock data in dev mode
      // Format the mock course data for the edit form
      const courseData = {
        id: mockCourse.id,
        title: mockCourse.title,
        shortDescription: mockCourse.shortDescription || '',
        description: mockCourse.description || '',
        difficulty: mockCourse.difficulty || 'BEGINNER',
        category: mockCourse.tags || '',
        language: mockCourse.language || 'en',
        isPublished: mockCourse.isPublished || false,
        isPrivate: mockCourse.isPrivate || false,
        price: mockCourse.price || 0,
        discountedPrice: mockCourse.discountedPrice || 0,
        
        // Parse JSON arrays with fallbacks to empty arrays
        requirements: parseJsonArray(mockCourse.requirements),
        learningOutcomes: parseJsonArray(mockCourse.learningOutcomes),
        targetAudience: parseJsonArray(mockCourse.targetAudience),
        
        imageUrl: mockCourse.imageUrl || '',
        promoVideoUrl: mockCourse.promoVideoUrl || '',
      };
      
      return NextResponse.json(courseData);
    }

    // If course doesn't exist and we're not in dev mode, return 404
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if the user is the instructor of this course
    const isInstructor = isDevMode || course.instructor.id.toString() === effectiveUserId;

    if (!isInstructor) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this course' },
        { status: 403 }
      );
    }

    // Format the response data to match what the edit form expects
    const courseData = {
      id: course.id,
      title: course.title,
      shortDescription: course.shortDescription || '',
      description: course.description || '',
      difficulty: course.difficulty || 'BEGINNER',
      category: course.tags || '',
      language: course.language || 'en',
      isPublished: course.isPublished || false,
      isPrivate: course.isPrivate || false,
      price: course.price || 0,
      discountedPrice: course.discountedPrice || 0,
      
      // Parse JSON arrays with fallbacks to empty arrays
      requirements: parseJsonArray(course.requirements),
      learningOutcomes: parseJsonArray(course.learningOutcomes),
      targetAudience: parseJsonArray(course.targetAudience),
      
      imageUrl: course.imageUrl || '',
      // Handle fields that might not be in the model schema directly
      promoVideoUrl: (course as any).promoVideoUrl || '',
    };

    return NextResponse.json(courseData);
  } catch (error) {
    console.error('Error fetching course for editing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course details' },
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
export async function PUT(request: Request, { params }: { params: { courseId: string } }) {
  try {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Check if the user is logged in
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to update a course' },
        { status: 401 }
      );
    }

    // Find the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { id: true } },
      },
    });

    // If course doesn't exist, return 404
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if the user is the instructor of this course
    const isInstructor = course.instructor.id.toString() === userId;

    if (!isInstructor) {
      return NextResponse.json(
        { error: 'You do not have permission to update this course' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    
    // Extract form data with validation
    const title = (formData.get('title') as string)?.trim();
    if (!title) {
      return NextResponse.json(
        { error: 'Course title is required' }, 
        { status: 400 }
      );
    }

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
    let discountedPrice = null;
    if (hasDiscount) {
      const discountedPriceStr = formData.get('discountedPrice') as string;
      if (discountedPriceStr) {
        const parsedDiscountedPrice = parseFloat(discountedPriceStr);
        if (!isNaN(parsedDiscountedPrice) && parsedDiscountedPrice >= 0 && parsedDiscountedPrice < price) {
          discountedPrice = parsedDiscountedPrice;
        }
      }
    }
    
    // Parse JSON arrays
    const requirements = parseJsonArrayFromFormData(formData.get('requirements'));
    const learningOutcomes = parseJsonArrayFromFormData(formData.get('learningOutcomes'));
    const targetAudience = parseJsonArrayFromFormData(formData.get('targetAudience'));
    
    const isPublished = formData.get('isPublished') === 'true';
    const isPrivate = formData.get('isPrivate') === 'true';
    const imageFile = formData.get('image') as File | null;
    
    // Set status based on isPublished
    const status = isPublished ? 'PUBLISHED' : 'DRAFT';

    // Handle image upload (placeholder for actual implementation)
    let imageUrl = course.imageUrl;
    // TODO: Implement actual image upload to your storage service
    // if (imageFile) {
    //   imageUrl = await uploadImageToStorage(imageFile);
    // }

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
    };

    // If there's a new image, include it in the update
    if (imageFile) {
      // TODO: Implement actual image upload
      // courseData.imageUrl = await uploadImageToStorage(imageFile);
    }

    // Update the course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: courseData,
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
    const parsed = JSON.parse(value.toString());
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // If parsing fails, try to split by comma
    const str = value.toString();
    return str ? str.split(',').map(item => item.trim()).filter(Boolean) : [];
  }
}
