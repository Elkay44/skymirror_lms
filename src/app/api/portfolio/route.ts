import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/portfolio - Get the current user's portfolio
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only students can have portfolios
    if (session.user.role !== 'Student') {
      return NextResponse.json({ error: 'Only students can have portfolios' }, { status: 403 });
    }
    
    // Fetch all approved project submissions for the student
    const projectSubmissions = await prisma.projectSubmission.findMany({
      where: {
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
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    // Fetch portfolio settings for the user
    const portfolioSettings = await prisma.portfolioSetting.findMany({
      where: {
        userId: session.user.id,
      },
    });
    
    // Get the user's portfolio visibility setting
    const userPortfolioSetting = portfolioSettings.find(setting => setting.userId === session.user.id && setting.projectId === null);
    const isPortfolioVisible = userPortfolioSetting?.isVisible ?? false;
    
    // Map of project IDs to their featured status
    const featuredProjects = new Map();
    portfolioSettings.forEach(setting => {
      if (setting.projectId) {
        featuredProjects.set(setting.projectId, setting.featured);
      }
    });
    
    // Format the project data for the portfolio
    const projects = await Promise.all(projectSubmissions.map(async (submission) => {
      // Extract skills from project description since Project model doesn't have tags
      // If you want to use tags, you should use the ShowcaseProject model
      const extractedSkills = extractSkillsFromDescription(submission.project.description || '');
      
      try {
        // Get the showcase project if it exists
        const showcaseProject = await prisma.showcaseProject.findFirst({
          where: { submissionId: submission.id },
          select: { demoUrl: true, featuredImage: true, sourceCodeUrl: true }
        });

        return {
          id: submission.projectId,
          title: submission.project.title,
          description: submission.project.description,
          courseTitle: submission.project.course.title,
          courseId: submission.project.courseId,
          completedAt: submission.updatedAt,
          repositoryUrl: showcaseProject?.sourceCodeUrl || null,
          demoUrl: showcaseProject?.demoUrl || null,
          imageUrl: showcaseProject?.featuredImage || null,
          skills: extractedSkills,
          featured: featuredProjects.get(submission.projectId) || false,
        };
      } catch (error) {
        console.error(`Error fetching showcase project for submission ${submission.id}:`, error);
        return {
          id: submission.projectId,
          title: submission.project.title,
          description: submission.project.description,
          courseTitle: submission.project.course.title,
          courseId: submission.project.courseId,
          completedAt: submission.updatedAt,
          repositoryUrl: null,
          demoUrl: null,
          imageUrl: null,
          skills: extractedSkills,
          featured: featuredProjects.get(submission.projectId) || false,
        };
      }
    }));
    
    return NextResponse.json({ 
      isVisible: isPortfolioVisible,
      projects 
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio - Update portfolio settings
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only students can manage portfolios
    if (session.user.role !== 'Student') {
      return NextResponse.json({ error: 'Only students can manage portfolios' }, { status: 403 });
    }
    
    const { visibility } = await req.json();
    
    // Update the user's portfolio visibility setting
    await prisma.portfolioSetting.upsert({
      where: { userId: session.user.id },
      update: { isVisible: visibility === 'public' },
      create: { 
        userId: session.user.id,
        isVisible: visibility === 'public'
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating portfolio settings:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio settings' },
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
