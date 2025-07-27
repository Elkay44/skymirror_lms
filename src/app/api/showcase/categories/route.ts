import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/showcase/categories - Get showcase categories with project counts
export async function GET(req: NextRequest) {
  try {
    // Get all unique tags from showcase projects
    const allProjects = await prisma.showcaseProject.findMany({
      select: {
        tags: true,
      },
      where: {
        isPublished: true,
      },
    });
    
    // Count occurrences of each tag
    const tagCounts = new Map<string, number>();
    allProjects.forEach(project => {
      if (project.tags) {
        const tags = project.tags.split(',').map(tag => tag.trim());
        tags.forEach(tag => {
          if (tag) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        });
      }
    });
    
    // Convert to array of { name, count } objects
    const categoryCounts = Array.from(tagCounts.entries())
      .map(([name, count]) => ({
        id: name,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        count,
        description: '',
        icon: '',
        color: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ categories: categoryCounts });
  } catch (error) {
    console.error('Error fetching showcase categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcase categories' },
      { status: 500 }
    );
  }
}
