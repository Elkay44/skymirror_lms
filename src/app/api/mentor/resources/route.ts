import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-extensions';

// GET - Fetch mentor resources
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    // For now, return placeholder resources since we don't have a Resource model yet
    // TODO: Implement actual Resource model and database queries
    const mockResources = [
      {
        id: 'resource_1',
        title: 'Effective Mentoring Guide',
        description: 'A comprehensive guide to effective mentoring techniques and best practices for career development.',
        type: 'DOCUMENT',
        url: '/resources/mentoring-guide.pdf',
        tags: ['mentoring', 'best-practices', 'career-development'],
        dateAdded: '2025-04-15T10:30:00Z',
        downloads: 127,
        author: 'SkyMirror Team',
        isPublic: true
      },
      {
        id: 'resource_2',
        title: 'Mastering One-on-One Meetings',
        description: 'Learn how to structure and conduct effective one-on-one meetings with your mentees.',
        type: 'VIDEO',
        url: 'https://www.youtube.com/watch?v=example1',
        tags: ['one-on-one', 'meetings', 'communication'],
        dateAdded: '2025-04-10T14:15:00Z',
        thumbnail: 'https://img.youtube.com/vi/example1/maxresdefault.jpg',
        duration: '15:30',
        author: 'SkyMirror Team',
        isPublic: true
      },
      {
        id: 'resource_3',
        title: 'Student Progress Tracking Template',
        description: 'A spreadsheet template for tracking student progress across different courses and skills.',
        type: 'DOCUMENT',
        url: '/resources/progress-tracking.xlsx',
        tags: ['tracking', 'progress', 'templates'],
        dateAdded: '2025-04-22T09:45:00Z',
        downloads: 89,
        author: 'SkyMirror Team',
        isPublic: true
      },
      {
        id: 'resource_4',
        title: 'Career Path Planning Tools',
        description: 'Tools and resources for helping mentees plan their career paths in technology.',
        type: 'LINK',
        url: 'https://example.com/career-tools',
        tags: ['career', 'planning', 'tools'],
        dateAdded: '2025-04-18T11:20:00Z',
        author: 'SkyMirror Team',
        isPublic: true
      },
      {
        id: 'resource_5',
        title: 'Advanced Mentoring Techniques Course',
        description: 'An online course covering advanced mentoring techniques for experienced mentors.',
        type: 'COURSE',
        url: '/courses/advanced-mentoring',
        tags: ['mentoring', 'advanced', 'techniques', 'course'],
        dateAdded: '2025-04-05T16:30:00Z',
        author: 'SkyMirror Team',
        isPublic: true
      },
      {
        id: 'resource_6',
        title: 'Interview Preparation Guide',
        description: 'Help your mentees prepare for job interviews with this comprehensive guide.',
        type: 'DOCUMENT',
        url: '/resources/interview-prep.pdf',
        tags: ['interview', 'preparation', 'career'],
        dateAdded: '2025-04-25T13:10:00Z',
        downloads: 56,
        author: 'SkyMirror Team',
        isPublic: true
      }
    ];

    // Apply filters
    let filteredResources = mockResources;

    if (type && type !== 'ALL') {
      filteredResources = filteredResources.filter(resource => resource.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredResources = filteredResources.filter(resource =>
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description.toLowerCase().includes(searchLower) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    const total = filteredResources.length;
    const paginatedResources = filteredResources.slice(offset, offset + limit);

    return NextResponse.json({
      resources: paginatedResources,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      summary: {
        totalResources: mockResources.length,
        documents: mockResources.filter(r => r.type === 'DOCUMENT').length,
        videos: mockResources.filter(r => r.type === 'VIDEO').length,
        links: mockResources.filter(r => r.type === 'LINK').length,
        courses: mockResources.filter(r => r.type === 'COURSE').length
      }
    });
  } catch (error) {
    console.error('Error fetching mentor resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST - Create a new resource (for future implementation)
export async function POST(_request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    // TODO: Implement resource creation when Resource model is available
    return NextResponse.json(
      { error: 'Resource creation not yet implemented. Resource model needs to be added to the database schema.' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
