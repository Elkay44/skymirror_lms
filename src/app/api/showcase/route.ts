import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/showcase - Get public showcase projects
export async function GET(req: Request) {
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
        submission: {
          select: {
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: [
        { featuredAt: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });
    
    // Track view (increment view counter)
    for (const project of projects) {
      // Increment view count for the project
      if (project.id) {
        await prisma.showcaseProject.update({
          where: { id: project.id },
          data: {
            views: { increment: 1 },
          },
        });
      }
    }
    
    // Format the response data
    const formattedProjects = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      student: {
        id: project.student.id,
        name: project.student.name,
        avatar: project.student.image,
      },
      project: project.submission?.project ? {
        id: project.submission.project.id,
        title: project.submission.project.title,
      } : null,
      demoUrl: project.demoUrl,
      repositoryUrl: project.sourceCodeUrl,
      imageUrl: project.featuredImage,
      featured: !!project.featuredAt,
      featuredAt: project.featuredAt,
      tags: project.tags ? project.tags.split(',').map(tag => tag.trim()) : [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      views: project.views,
      likes: project.likes,
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
