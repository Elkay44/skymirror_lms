import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink, GitHub, Award, Tag, Clock, BookOpen, Mail, Linkedin, Globe } from 'lucide-react';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Portfolio | SkyMirror Academy',
  description: 'View this student\'s project portfolio from SkyMirror Academy.',
};

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  courseTitle: string;
  completedAt: string;
  repositoryUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  skills: string[];
  featured: boolean;
}

export default async function PublicPortfolio({ params }: { params: { userId: string } }) {
  const { userId } = params;
  
  // Fetch the user and their completed projects
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      portfolioVisibility: true,
      linkedinUrl: true,
      personalWebsite: true,
      role: true,
    },
  });
  
  // Check if user exists and portfolio is visible
  if (!user || user.portfolioVisibility !== 'PUBLIC' || user.role !== 'Student') {
    redirect('/not-found');
  }
  
  // Fetch all approved project submissions for the student
  const projectSubmissions = await prisma.projectSubmission.findMany({
    where: {
      studentId: userId,
      status: 'APPROVED',
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
  
  // Fetch portfolio settings for projects that have been featured
  const portfolioSettings = await prisma.portfolioSetting.findMany({
    where: {
      userId,
    },
  });
  
  // Map of project IDs to their featured status
  const featuredProjects = new Map();
  portfolioSettings.forEach(setting => {
    featuredProjects.set(setting.projectId, setting.featured);
  });
  
  // Format the project data for the portfolio
  const projects = projectSubmissions.map(submission => {
    // Extract skills from project tags or description
    const projectTags = submission.project.tags || [];
    const extractedSkills = projectTags.length > 0 
      ? projectTags 
      : extractSkillsFromDescription(submission.project.description);
    
    return {
      id: submission.projectId,
      title: submission.project.title,
      description: submission.project.description,
      courseTitle: submission.project.course.title,
      completedAt: submission.updatedAt,
      repositoryUrl: submission.repositoryUrl || null,
      demoUrl: submission.demoUrl || null,
      imageUrl: submission.project.imageUrl || null,
      skills: extractedSkills,
      featured: featuredProjects.get(submission.projectId) || false,
    };
  });
  
  // Filter featured projects
  const featuredProjectsList = projects.filter(project => project.featured);
  
  // Extract all unique skills from projects
  const skillSet = new Set<string>();
  projects.forEach(project => {
    project.skills.forEach(skill => skillSet.add(skill));
  });
  
  const allSkills = Array.from(skillSet);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user info */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-shrink-0">
              {user.image ? (
                <Image 
                  src={user.image} 
                  alt={user.name || 'Profile'} 
                  width={120} 
                  height={120}
                  className="rounded-full border-4 border-white/30" 
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-blue-800 flex items-center justify-center text-3xl font-bold">
                  {user.name?.charAt(0) || 'S'}
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="mt-2 text-xl text-blue-100">
                SkyMirror Academy Student
              </p>
              <p className="mt-2 max-w-2xl text-blue-200">
                {user.bio || 'A passionate learner at SkyMirror Academy, showcasing completed projects and acquired skills.'}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                {user.email && (
                  <a 
                    href={`mailto:${user.email}`}
                    className="flex items-center text-white hover:text-blue-200 transition-colors"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Email
                  </a>
                )}
                
                {user.linkedinUrl && (
                  <a 
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="flex items-center text-white hover:text-blue-200 transition-colors"
                  >
                    <Linkedin className="h-5 w-5 mr-2" />
                    LinkedIn
                  </a>
                )}
                
                {user.personalWebsite && (
                  <a 
                    href={user.personalWebsite}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="flex items-center text-white hover:text-blue-200 transition-colors"
                  >
                    <Globe className="h-5 w-5 mr-2" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Skills section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Tag className="h-5 w-5 mr-2 text-blue-600" />
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {allSkills.map(skill => (
              <span 
                key={skill}
                className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        
        {/* Featured projects section */}
        {featuredProjectsList.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Award className="h-6 w-6 mr-2 text-yellow-500" />
              Featured Projects
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjectsList.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>
        )}
        
        {/* All projects section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
            All Projects
          </h2>
          
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <p className="text-gray-600">
                No completed projects available yet.
              </p>
            </div>
          )}
        </section>
        
        {/* Footer with SkyMirror branding */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 inline-flex items-center font-medium"
          >
            <Image 
              src="/logo.png" 
              alt="SkyMirror Academy" 
              width={24} 
              height={24} 
              className="mr-2"
            />
            SkyMirror Academy
          </Link>
          <p className="mt-2 text-sm text-gray-500">
            Empowering the next generation of tech talent through project-based learning
          </p>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: PortfolioProject }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${project.featured ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="relative h-48 bg-gray-200">
        {project.imageUrl ? (
          <Image 
            src={project.imageUrl} 
            alt={project.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50">
            <div className="text-blue-500 text-xl font-semibold">{project.title.substring(0, 2).toUpperCase()}</div>
          </div>
        )}
        
        {project.featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center">
            <Award className="h-3 w-3 mr-1" />
            Featured
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
        <p className="text-gray-600 text-sm mb-3">{project.description}</p>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Clock className="h-4 w-4 mr-1" />
          <span>Completed {new Date(project.completedAt).toLocaleDateString()}</span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {project.skills.map(skill => (
            <span key={skill} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {skill}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between">
          {project.demoUrl && (
            <a 
              href={project.demoUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              View Demo
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          )}
          
          {project.repositoryUrl && (
            <a 
              href={project.repositoryUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-gray-900 text-sm font-medium flex items-center"
            >
              <GitHub className="h-4 w-4 mr-1" />
              Repository
            </a>
          )}
        </div>
      </div>
    </div>
  );
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
