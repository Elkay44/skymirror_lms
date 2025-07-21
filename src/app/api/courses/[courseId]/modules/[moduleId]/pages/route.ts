/* eslint-disable */

import { NextResponse } from 'next/server';

// GET /api/courses/[courseId]/modules/[moduleId]/pages - Get all pages for a module
export async function GET() {
  try {
    // Return mock pages data
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'page_1',
          title: 'Introduction',
          description: 'Welcome to the course',
          slug: 'introduction',
          isPublished: true,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          blockCount: 3
        },
        {
          id: 'page_2',
          title: 'Getting Started',
          description: 'How to get started with the course',
          slug: 'getting-started',
          isPublished: true,
          order: 2,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          blockCount: 2
        },
        {
          id: 'page_3',
          title: 'Advanced Topics',
          description: 'Advanced course materials',
          slug: 'advanced-topics',
          isPublished: false,
          order: 3,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
          blockCount: 5
        }
      ],
      module: {
        id: 'module_1',
        title: 'Introduction',
        isPublished: true,
        courseId: 'course_1'
      },
      canCreate: true,
      canEdit: true,
      canDelete: true
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/pages - Create a new page
export async function POST() {
  try {
    // Return success response with created page data
    return NextResponse.json({
      success: true,
      message: 'Page created successfully',
      data: {
        id: 'page_' + Date.now(),
        title: 'New Page',
        description: 'New page description',
        slug: 'new-page',
        isPublished: false,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        blockCount: 0
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create page',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
