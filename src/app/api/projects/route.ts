import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/projects - Get projects the user has access to
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const role = session.user.role;
    const userId = session.user.id;
    
    let projects: Array<{
      id: string;
      title: string;
      description: string | null;
      instructions: string | null;
      dueDate: Date | null;
      pointsValue: number;
      isPublished: boolean;
      courseId: string;
      moduleId: string | null;
      isRequiredForCertification: boolean;
      createdAt: Date;
      updatedAt: Date;
      _count?: { submissions: number };
      submissions?: Array<{
        id: string;
        status: string;
        submittedAt: Date | null;
      }>;
      course?: {
        title: string;
      };
    }> = [];
    
    // Different logic based on user role
    if (role === 'INSTRUCTOR') {
      // Instructors see all projects in their courses
      if (courseId) {
        // Verify instructor teaches this course
        const course = await prisma.course.findFirst({
          where: {
            id: courseId,
            instructorId: userId
          }
        });
        
        if (!course) {
          return NextResponse.json({ error: 'Not authorized to access this course' }, { status: 403 });
        }
        
        projects = await prisma.project.findMany({
          where: { courseId },
          include: {
            _count: {
              select: { submissions: true }
            },
            submissions: {
              orderBy: { submittedAt: 'desc' },
              take: 1
            },
            course: {
              select: {
                title: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        // Get all projects from instructor's courses
        projects = await prisma.project.findMany({
          where: {
            course: {
              instructorId: userId
            }
          },
          include: {
            course: {
              select: { title: true }
            },
            _count: {
              select: { submissions: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    } else if (role === 'STUDENT') {
      // Students see projects from enrolled courses
      if (courseId) {
        // Verify student is enrolled in this course
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            courseId,
            userId: parseInt(userId.toString(), 10) // Convert string userId to number for comparison
          }
        });
        
        if (!enrollment) {
          return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
        }
        
        projects = await prisma.project.findMany({
          where: { courseId },
          include: {
            submissions: {
              where: { studentId: userId },
              select: { 
                id: true,
                status: true,
                submittedAt: true,
                grade: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        // Get projects from all enrolled courses
        projects = await prisma.project.findMany({
          where: {
            course: {
              enrollments: {
                some: { userId }
              }
            }
          },
          include: {
            course: {
              select: { title: true }
            },
            submissions: {
              where: { studentId: userId },
              select: { 
                id: true,
                status: true,
                submittedAt: true,
                grade: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    } else if (role === 'MENTOR') {
      // Mentors see projects from their mentees' courses
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: userId }
      });
      
      if (!mentorProfile) {
        return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
      }
      
      // Get mentorships
      const mentorships = await prisma.mentorship.findMany({
        where: {
          mentorId: mentorProfile.id,
          status: 'ACTIVE'
        },
        select: {
          student: {
            select: {
              user: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      });
      
      const menteeIds = mentorships.map((m: any) => m.student.user.id);
      
      if (courseId) {
        projects = await prisma.project.findMany({
          where: { 
            courseId,
            course: {
              enrollments: {
                some: {
                  user: {
                    studentProfile: {
                      id: { in: menteeIds }
                    }
                  }
                }
              }
            }
          },
          include: {
            course: {
              select: { title: true }
            },
            submissions: {
              where: {
                student: {
                  studentProfile: {
                    id: { in: menteeIds }
                  }
                }
              },
              include: {
                student: {
                  select: { name: true }
                }
              }
            }
          }
        });
      } else {
        projects = await prisma.project.findMany({
          where: {
            course: {
              enrollments: {
                some: {
                  user: {
                    studentProfile: {
                      id: { in: menteeIds }
                    }
                  }
                }
              }
            }
          },
          include: {
            course: {
              select: { title: true }
            },
            submissions: {
              where: {
                student: {
                  studentProfile: {
                    id: { in: menteeIds }
                  }
                }
              },
              include: {
                student: {
                  select: { name: true }
                }
              }
            }
          }
        });
      }
    }
    
    // Return the projects directly as an array to match the client's expectation
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project (instructors only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Only instructors can create projects' }, { status: 403 });
    }
    
    // Parse request body
    const body = await req.json();
    const { 
      title, 
      description, 
      instructions,
      courseId, 
      dueDate, 
      skills, 
      pointsValue,
      isPublished,
      isRequiredForCertification, 
      moduleId 
    } = body;
    
    if (!title || !courseId) {
      return NextResponse.json({ error: 'Title and course ID are required' }, { status: 400 });
    }
    
    // Verify instructor teaches this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: parseInt(session.user.id.toString(), 10) // Convert string userId to number
      }
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Not authorized to add projects to this course' }, { status: 403 });
    }
    
    // Create the project
    const project = await prisma.project.create({
      data: {
        title,
        description,
        instructions,
        courseId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        pointsValue: pointsValue !== undefined ? pointsValue : 10,
        isPublished: isPublished !== undefined ? isPublished : false,
        isRequiredForCertification: isRequiredForCertification ?? true,
        moduleId,
        // Store skills as a JSON string in the database if provided
        // We need to convert the skills array to a JSON string for storage
        skills: skills ? JSON.stringify(skills) : undefined
      }
    });
    
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
