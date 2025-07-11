import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/portfolio/[projectId] - Get a specific project in the portfolio
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { projectId } = params;
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
              },
            },
          },
        },
        reviews: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            reviewer: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });
    
    if (!projectSubmission) {
      return NextResponse.json({ error: 'Project not found in portfolio' }, { status: 404 });
    }
    
    // Fetch portfolio settings for this project
    const portfolioSetting = await prisma.portfolioSetting.findFirst({
      where: {
        userId: session.user.id,
        projectId,
      },
    });
    
    // Extract skills from project tags or description
    const projectTags = projectSubmission.project.tags || [];
    const extractedSkills = projectTags.length > 0 
      ? projectTags 
      : extractSkillsFromDescription(projectSubmission.project.description);
    
    // Format the project data for the portfolio
    const project = {
      id: projectSubmission.projectId,
      title: projectSubmission.project.title,
      description: projectSubmission.project.description,
      courseTitle: projectSubmission.project.course.title,
      courseId: projectSubmission.project.courseId,
      completedAt: projectSubmission.updatedAt,
      repositoryUrl: projectSubmission.repositoryUrl || null,
      demoUrl: projectSubmission.demoUrl || null,
      imageUrl: projectSubmission.project.imageUrl || null,
      skills: extractedSkills,
      featured: portfolioSetting?.featured || false,
      reviews: projectSubmission.reviews.map(review => ({
        id: review.id,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewer: review.reviewer,
      })),
    };
    
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project details' },
      { status: 500 }
    );
  }
}

// PATCH /api/portfolio/[projectId] - Update a project in the portfolio
export async function PATCH(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { projectId } = params;
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only students can update their portfolio
    if (session.user.role !== 'Student') {
      return NextResponse.json({ error: 'Only students can update portfolios' }, { status: 403 });
    }
    
    // Verify that the project exists and belongs to the student
    const projectSubmission = await prisma.projectSubmission.findFirst({
      where: {
        projectId,
        studentId: session.user.id,
        status: 'APPROVED',  // Only include approved submissions
      },
    });
    
    if (!projectSubmission) {
      return NextResponse.json({ error: 'Project not found in portfolio' }, { status: 404 });
    }
    
    const updateData = await req.json();
    const { featured, description, repositoryUrl, demoUrl } = updateData;
    
    // Update or create portfolio settings
    await prisma.portfolioSetting.upsert({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId,
        },
      },
      update: {
        featured: featured !== undefined ? featured : undefined,
        customDescription: description,
      },
      create: {
        userId: session.user.id,
        projectId,
        featured: featured !== undefined ? featured : false,
        customDescription: description,
      },
    });
    
    // Update submission URLs if provided
    if (repositoryUrl !== undefined || demoUrl !== undefined) {
      await prisma.projectSubmission.update({
        where: {
          id: projectSubmission.id,
        },
        data: {
          repositoryUrl: repositoryUrl !== undefined ? repositoryUrl : projectSubmission.repositoryUrl,
          demoUrl: demoUrl !== undefined ? demoUrl : projectSubmission.demoUrl,
        },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// Helper function to extract skills from project description
function extractSkillsFromDescription(description: string): string[] {
  // Common programming languages and technologies to look for
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'HTML', 'CSS', 'SASS', 'LESS', 'Tailwind', 'Bootstrap', 'Material UI', 'Redux', 'GraphQL', 'REST API',
    'CI/CD', 'Git', 'GitHub', 'GitLab', 'Agile', 'Scrum', 'TDD', 'Jest', 'Mocha', 'Chai', 'Cypress',
    'Machine Learning', 'AI', 'Data Science', 'Big Data', 'Blockchain', 'IoT', 'Mobile Development',
    'Web Development', 'Backend', 'Frontend', 'Fullstack', 'DevOps', 'Cloud Computing', 'Microservices',
    'Security', 'UI/UX', 'Design Patterns', 'Object-Oriented Programming', 'Functional Programming'
  ];
  
  const skills: string[] = [];
  
  // Check for each skill in the description
  commonSkills.forEach(skill => {
    if (description.includes(skill)) {
      skills.push(skill);
    }
  });
  
  // If we couldn't extract skills, provide some generic ones
  if (skills.length === 0) {
    return ['Project Management', 'Problem Solving', 'Technical Communication'];
  }
  
  return skills;
}
