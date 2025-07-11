import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/showcase/categories - Get showcase categories with project counts
export async function GET(req: NextRequest) {
  try {
    // Get categories with counts from the database
    const categoryCounts = await prisma.showcaseProject.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });
    
    // Get category metadata from the settings table
    const categorySettings = await prisma.setting.findMany({
      where: {
        category: 'showcase_category',
      },
    });
    
    // Map of category IDs to their metadata
    const categoryMap = new Map();
    categorySettings.forEach(setting => {
      try {
        const metadata = JSON.parse(setting.value);
        categoryMap.set(setting.key, metadata);
      } catch (e) {
        console.error(`Error parsing category metadata for ${setting.key}:`, e);
      }
    });
    
    // Format the response
    const categories = categoryCounts.map(category => {
      const metadata = categoryMap.get(category.category) || {};
      
      return {
        id: category.category,
        name: metadata.name || category.category,
        description: metadata.description || '',
        icon: metadata.icon || null,
        color: metadata.color || null,
        count: category._count.id,
      };
    });
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching showcase categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcase categories' },
      { status: 500 }
    );
  }
}
