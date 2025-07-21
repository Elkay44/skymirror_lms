/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/portfolio/[projectId]
 * Get a specific project in the portfolio
 */
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { projectId } = await params;
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Fetch the project submission
    const projectSubmission = await prisma.projectSubmission.findFirst({
      where: {
        projectId,
        studentId: session.user.id,
        status: 'APPROVED',  // Only include approved submissions
      },
      include: {
        project: {
          include: {
            course: {
              select: {
                title: true,
                code: true,
                thumbnailUrl: true,
              },
            },
            skills: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        reviews: {
          where: {
            status: 'PUBLISHED',
          },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!projectSubmission) {
      return NextResponse.json(
        { error: 'Project not found in your portfolio' }, 
        { status: 404 }
      );
    }

    // Calculate average rating
    const avgRating = projectSubmission.reviews.length > 0
      ? projectSubmission.reviews.reduce((sum, review) => sum + review.rating, 0) / projectSubmission.reviews.length
      : 0;

    // Format the response
    const response = {
      ...projectSubmission,
      project: {
        ...projectSubmission.project,
        averageRating: parseFloat(avgRating.toFixed(1)),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching portfolio project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio project' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/portfolio/[projectId]
 * Update a project in the portfolio
 */
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { projectId } = await params;
    const updateData = await req.json();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Validate update data
    const allowedUpdates = [
      'title',
      'description',
      'repositoryUrl',
      'demoUrl',
      'isPublic',
      'featuredImage',
      'technologies',
      'challenges',
      'learnings',
      'futureImprovements',
    ];
    
    const updates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as Record<string, any>);
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' }, 
        { status: 400 }
      );
    }
    
    // Check if the project exists and belongs to the user
    const existingProject = await prisma.projectSubmission.findFirst({
      where: {
        projectId,
        studentId: session.user.id,
      },
    });
    
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found in your portfolio' }, 
        { status: 404 }
      );
    }
    
    // Extract skills from description if it's being updated
    let skillsToConnect: { id: string }[] = [];
    if (updates.description) {
      const skills = extractSkillsFromDescription(updates.description);
      
      // Find or create skills
      await Promise.all(
        skills.map(async (skillName) => {
          const skill = await prisma.skill.upsert({
            where: { name: skillName },
            create: { name: skillName },
            update: {},
          });
          skillsToConnect.push({ id: skill.id });
        })
      );
    }
    
    // Update the project
    const updatedProject = await prisma.projectSubmission.update({
      where: {
        id: existingProject.id,
      },
      data: {
        ...updates,
        ...(skillsToConnect.length > 0 && {
          project: {
            update: {
              skills: {
                set: skillsToConnect,
              },
            },
          },
        }),
        updatedAt: new Date(),
      },
      include: {
        project: {
          include: {
            skills: true,
            course: {
              select: {
                title: true,
                code: true,
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating portfolio project:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio project' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to extract skills from project description
 */
function extractSkillsFromDescription(description: string): string[] {
  if (!description) return [];
  
  // Common tech skills to look for
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js',
    'Python', 'Django', 'Flask', 'Java', 'Spring', 'C#', '.NET',
    'Ruby', 'Rails', 'PHP', 'Laravel', 'Go', 'Rust', 'Swift',
    'Kotlin', 'Dart', 'Flutter', 'React Native', 'Vue', 'Angular',
    'Svelte', 'Redux', 'GraphQL', 'REST', 'Docker', 'Kubernetes',
    'AWS', 'Azure', 'GCP', 'Firebase', 'MongoDB', 'PostgreSQL',
    'MySQL', 'SQL Server', 'SQLite', 'Redis', 'Elasticsearch',
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jest', 'Mocha',
    'Cypress', 'Selenium', 'JUnit', 'Jest', 'Puppeteer',
  ];
  
  // Convert to lowercase for case-insensitive matching
  const descriptionLower = description.toLowerCase();
  
  // Find skills mentioned in the description
  const foundSkills = commonSkills.filter(skill => 
    descriptionLower.includes(skill.toLowerCase())
  );
  
  return Array.from(new Set(foundSkills)); // Remove duplicates
}
