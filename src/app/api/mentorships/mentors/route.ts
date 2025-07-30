import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Mentor } from '@/types/mentorship';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const mentors = await prisma.user.findMany({
      where: {
        AND: [
          {
            role: {
              equals: 'MENTOR'
            }
          },
          {
            mentorProfile: {
              is: {
                specialties: {
                  not: null
                }
              }
            }
          }
        ],
        OR: [
          {
            name: {
              contains: search.toLowerCase()
            }
          },
          {
            mentorProfile: {
              specialties: {
                contains: search.toLowerCase()
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        mentorProfile: {
          select: {
            id: true,
            bio: true,
            specialties: true,
            rating: true,
            reviewCount: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        mentorProfile: {
          rating: 'desc'
        }
      }
    });

    // Filter out any users without a mentor profile
    const validMentors = mentors.filter((user) => user.mentorProfile);

    const formattedMentors: Mentor[] = validMentors.map((user) => ({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      image: user.image || null,
      role: user.role,
      bio: user.mentorProfile?.bio || null,
      specialties: user.mentorProfile?.specialties || null,
      rating: user.mentorProfile?.rating || 0,
      reviewCount: user.mentorProfile?.reviewCount || 0,
      createdAt: user.mentorProfile?.createdAt || new Date(),
      updatedAt: user.mentorProfile?.updatedAt || new Date()
    }));

    return NextResponse.json(formattedMentors);
  } catch (error: any) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mentors' },
      { status: 500 }
    );
  }
}
