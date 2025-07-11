import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/showcase - Get public showcase projects
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get('category');
    const searchTerm = url.searchParams.get('q');
    const featuredOnly = url.searchParams.get('featured') === 'true';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');
    
    // Build the query
    const where: any = {};
    
    // Filter by category if provided
    if (categoryId) {
      where.category = categoryId;
    }
    
    // Filter by search term if provided
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { hasSome: [searchTerm] } },
        { student: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }
    
    // Filter by featured status if requested
    if (featuredOnly) {
      where.featured = true;
    }
    
    // Get the total count for pagination
    const totalCount = await prisma.showcaseProject.count({ where });
    
    // Get the projects
    const projects = await prisma.showcaseProject.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { showcasedAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });
    
    // Track view (increment view counter)
    for (const project of projects) {
      // Only record the view once per request to avoid spamming
      await prisma.showcaseProject.update({
        where: { id: project.id },
        data: { viewCount: { increment: 1 } },
      });
    }
    
    // Format the response
    const formattedProjects = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      studentId: project.studentId,
      studentName: project.student.name,
      studentImage: project.student.image,
      courseId: project.courseId,
      courseTitle: project.course.title,
      submissionId: project.submissionId,
      repositoryUrl: project.repositoryUrl,
      demoUrl: project.demoUrl,
      imageUrl: project.imageUrl,
      featured: project.featured,
      category: project.category,
      tags: project.tags,
      showcasedAt: project.showcasedAt,
      viewCount: project.viewCount,
    }));
    
    // Return the projects and pagination info
    return NextResponse.json({
      projects: formattedProjects,
      pagination: {
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching showcase projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcase projects' },
      { status: 500 }
    );
  }
}
