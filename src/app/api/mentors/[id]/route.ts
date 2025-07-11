import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/mentors/[id]
 * Get details of a specific mentor
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const mentorId = params.id;
    
    // Get mentor with user information, active mentorships, and reviews
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            role: true,
          }
        },
        mentorships: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                }
              }
            }
          },
          take: 5 // Limit to 5 active mentorships
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        careerPaths: {
          where: { isPublic: true },
          select: {
            id: true,
            name: true,
            description: true,
            estimatedTime: true,
            _count: {
              select: { students: true }
            }
          },
          take: 3
        },
        _count: {
          select: {
            mentorships: true,
            careerPaths: true,
            reviews: true
          }
        }
      }
    });
    
    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }
    
    // Format the mentor data
    const formattedMentor = {
      id: mentor.id,
      userId: mentor.userId,
      name: mentor.user.name,
      email: mentor.user.email,
      image: mentor.user.image,
      bio: mentor.user.bio || mentor.bio,
      role: mentor.user.role,
      specialties: mentor.specialties ? mentor.specialties.split(',').map(s => s.trim()) : [],
      yearsExperience: mentor.yearsExperience,
      availableHours: mentor.availableHours,
      rating: mentor.rating,
      reviewCount: mentor.reviewCount,
      isAvailable: mentor.isAvailable,
      stats: {
        menteeCount: mentor._count.mentorships,
        careerPathsCount: mentor._count.careerPaths,
        reviewCount: mentor._count.reviews
      },
      activeMentees: mentor.mentorships.map(mentorship => ({
        mentorshipId: mentorship.id,
        studentId: mentorship.student.id,
        userId: mentorship.student.user.id,
        name: mentorship.student.user.name,
        image: mentorship.student.user.image,
        startDate: mentorship.startDate
      })),
      recentReviews: mentor.reviews.map(review => ({
        id: review.id,
        studentId: review.studentId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      })),
      careerPaths: mentor.careerPaths.map(path => ({
        id: path.id,
        name: path.name,
        description: path.description,
        estimatedTime: path.estimatedTime,
        studentCount: path._count.students
      })),
      createdAt: mentor.createdAt,
      updatedAt: mentor.updatedAt
    };
    
    // Check if the current user has a mentorship with this mentor
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });
    
    if (studentProfile) {
      const mentorship = await prisma.mentorship.findUnique({
        where: {
          mentorId_studentId: {
            mentorId: mentor.id,
            studentId: studentProfile.id
          }
        }
      });
      
      formattedMentor.currentMentorship = mentorship ? {
        id: mentorship.id,
        status: mentorship.status,
        startDate: mentorship.startDate,
        endDate: mentorship.endDate
      } : null;
    }
    
    return NextResponse.json(formattedMentor);
  } catch (error) {
    console.error(`Error fetching mentor:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor details' },
      { status: 500 }
    );
  }
}
