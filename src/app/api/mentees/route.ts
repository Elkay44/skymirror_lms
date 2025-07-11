import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET: Fetch mentees assigned to the logged-in mentor
export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only mentors can access this endpoint
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Only mentors can access this resource.' }, { status: 403 });
    }
    
    // In a production environment, this would fetch from a database
    // For now, we'll return mock data
    const mentees = [
      {
        id: 'student_1',
        name: 'Alex Johnson',
        email: 'alex.johnson@example.com',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        enrolledCourses: [
          {
            id: 'course_1',
            title: 'Advanced JavaScript',
            progress: 68,
            lastActivity: '2025-05-20T14:30:00Z',
            instructor: 'Dr. Maya Patel',
            grade: 'B+',
            status: 'active'
          },
          {
            id: 'course_2',
            title: 'React Fundamentals',
            progress: 92,
            lastActivity: '2025-05-23T11:15:00Z',
            instructor: 'John Wilson',
            grade: 'A',
            status: 'active'
          }
        ],
        upcomingAssignments: [
          {
            id: 'assignment_1',
            title: 'JavaScript Promises Project',
            dueDate: '2025-06-01T23:59:00Z',
            courseId: 'course_1',
            courseName: 'Advanced JavaScript',
            submitted: false
          },
          {
            id: 'assignment_2',
            title: 'React State Management',
            dueDate: '2025-05-28T23:59:00Z',
            courseId: 'course_2',
            courseName: 'React Fundamentals',
            submitted: true
          }
        ],
        nextSession: {
          id: 'session_1',
          date: '2025-05-27T15:00:00Z',
          duration: 60, // minutes
          topic: 'Career Growth Planning'
        },
        learningPath: 'Front-end Development',
        mentorshipNotes: 'Alex is making good progress with React concepts but needs more practice with advanced JavaScript patterns.'
      },
      {
        id: 'student_2',
        name: 'Sophia Lee',
        email: 'sophia.lee@example.com',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        enrolledCourses: [
          {
            id: 'course_3',
            title: 'Python Data Science',
            progress: 45,
            lastActivity: '2025-05-19T09:45:00Z',
            instructor: 'Dr. James Rodriguez',
            grade: 'B',
            status: 'active'
          },
          {
            id: 'course_4',
            title: 'Machine Learning Fundamentals',
            progress: 32,
            lastActivity: '2025-05-22T16:20:00Z',
            instructor: 'Dr. Aisha Khan',
            grade: 'B-',
            status: 'active'
          }
        ],
        upcomingAssignments: [
          {
            id: 'assignment_3',
            title: 'Pandas Data Analysis Project',
            dueDate: '2025-05-30T23:59:00Z',
            courseId: 'course_3',
            courseName: 'Python Data Science',
            submitted: false
          },
          {
            id: 'assignment_4',
            title: 'Classification Algorithms Lab',
            dueDate: '2025-06-05T23:59:00Z',
            courseId: 'course_4',
            courseName: 'Machine Learning Fundamentals',
            submitted: false
          }
        ],
        nextSession: {
          id: 'session_2',
          date: '2025-05-26T11:00:00Z',
          duration: 45, // minutes
          topic: 'Data Science Project Review'
        },
        learningPath: 'Data Science',
        mentorshipNotes: 'Sophia is struggling with statistics concepts. Need to provide additional resources and review sessions.'
      },
      {
        id: 'student_3',
        name: 'Marcus Williams',
        email: 'marcus.williams@example.com',
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
        enrolledCourses: [
          {
            id: 'course_5',
            title: 'Cloud Architecture',
            progress: 78,
            lastActivity: '2025-05-24T13:10:00Z',
            instructor: 'Sarah Martinez',
            grade: 'A-',
            status: 'active'
          },
          {
            id: 'course_6',
            title: 'DevOps Principles',
            progress: 85,
            lastActivity: '2025-05-23T10:30:00Z',
            instructor: 'Michael Chen',
            grade: 'A',
            status: 'active'
          }
        ],
        upcomingAssignments: [
          {
            id: 'assignment_5',
            title: 'AWS Infrastructure as Code',
            dueDate: '2025-06-02T23:59:00Z',
            courseId: 'course_5',
            courseName: 'Cloud Architecture',
            submitted: false
          },
          {
            id: 'assignment_6',
            title: 'CI/CD Pipeline Implementation',
            dueDate: '2025-05-29T23:59:00Z',
            courseId: 'course_6',
            courseName: 'DevOps Principles',
            submitted: false
          }
        ],
        nextSession: {
          id: 'session_3',
          date: '2025-05-29T16:30:00Z',
          duration: 60, // minutes
          topic: 'Cloud Certification Prep'
        },
        learningPath: 'Cloud & DevOps',
        mentorshipNotes: 'Marcus is excelling in all courses. Recommend additional advanced material and possibly exploring Azure in addition to AWS.'
      }
    ];
    
    return NextResponse.json({ mentees });
  } catch (error) {
    console.error('Error fetching mentee data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET with menteeId: Fetch detailed information about a specific mentee
export async function GET_MENTEE(req: NextRequest, { params }: { params: { menteeId: string } }) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only mentors can access this endpoint
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Only mentors can access this resource.' }, { status: 403 });
    }
    
    const menteeId = params.menteeId;
    
    if (!menteeId) {
      return NextResponse.json({ error: 'Mentee ID is required' }, { status: 400 });
    }
    
    // In a production environment, this would fetch from a database
    // For now, we'll simulate a mentee record lookup
    const mentee = {
      id: menteeId,
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      enrolledCourses: [
        {
          id: 'course_1',
          title: 'Advanced JavaScript',
          progress: 68,
          lastActivity: '2025-05-20T14:30:00Z',
          instructor: 'Dr. Maya Patel',
          grade: 'B+',
          status: 'active',
          // Additional detailed course data
          modules: [
            {
              id: 'module_1',
              title: 'JavaScript Promises and Async Programming',
              progress: 100,
              completed: true,
              score: 92
            },
            {
              id: 'module_2',
              title: 'ES6+ Features and Modern JavaScript',
              progress: 85,
              completed: false,
              score: 78
            },
            {
              id: 'module_3',
              title: 'Design Patterns in JavaScript',
              progress: 35,
              completed: false,
              score: null
            },
            {
              id: 'module_4',
              title: 'Advanced DOM Manipulation',
              progress: 0,
              completed: false,
              score: null
            }
          ],
          assignments: [
            {
              id: 'assignment_1',
              title: 'JavaScript Promises Project',
              dueDate: '2025-06-01T23:59:00Z',
              submitted: false,
              grade: null,
              feedback: null
            },
            {
              id: 'assignment_prev_1',
              title: 'ES6 Features Implementation',
              dueDate: '2025-05-15T23:59:00Z',
              submitted: true,
              submittedDate: '2025-05-14T22:30:00Z',
              grade: 'A-',
              feedback: 'Good understanding of ES6 features. Try to use more destructuring where appropriate.'
            }
          ]
        },
        // Other courses would be listed here
      ],
      assessments: [
        {
          id: 'assessment_1',
          title: 'JavaScript Fundamentals Quiz',
          date: '2025-05-10T14:00:00Z',
          score: 85,
          maxScore: 100,
          courseId: 'course_1',
          courseName: 'Advanced JavaScript'
        },
        {
          id: 'assessment_2',
          title: 'Promises and Async/Await Assessment',
          date: '2025-05-18T10:30:00Z',
          score: 92,
          maxScore: 100,
          courseId: 'course_1',
          courseName: 'Advanced JavaScript'
        }
      ],
      mentorshipSessions: [
        {
          id: 'session_prev_1',
          date: '2025-05-13T15:00:00Z',
          duration: 45, // minutes
          topic: 'JavaScript Career Opportunities',
          notes: 'Discussed potential career paths in JavaScript development. Alex expressed interest in front-end frameworks, particularly React.',
          actionItems: [
            'Complete React intro course by end of month',
            'Work on portfolio projects',
            'Review ES6 concepts'
          ]
        },
        {
          id: 'session_prev_2',
          date: '2025-05-06T14:30:00Z',
          duration: 60, // minutes
          topic: 'Learning Path Review',
          notes: 'Reviewed progress in JavaScript course. Alex is doing well but struggling with some advanced concepts.',
          actionItems: [
            'Focus on promise chaining exercises',
            'Review module 2 materials',
            'Schedule extra practice session'
          ]
        },
        {
          id: 'session_next',
          date: '2025-05-27T15:00:00Z',
          duration: 60, // minutes
          topic: 'Career Growth Planning',
          notes: '',
          actionItems: []
        }
      ],
      learningPath: {
        name: 'Front-end Development',
        progress: 45,
        startDate: '2025-03-01T00:00:00Z',
        estimatedCompletionDate: '2025-09-30T00:00:00Z',
        milestones: [
          {
            id: 'milestone_1',
            title: 'HTML/CSS Mastery',
            completed: true,
            completionDate: '2025-04-15T00:00:00Z'
          },
          {
            id: 'milestone_2',
            title: 'JavaScript Proficiency',
            completed: false,
            estimatedCompletionDate: '2025-06-30T00:00:00Z'
          },
          {
            id: 'milestone_3',
            title: 'React Development',
            completed: false,
            estimatedCompletionDate: '2025-08-15T00:00:00Z'
          },
          {
            id: 'milestone_4',
            title: 'Full Stack Integration',
            completed: false,
            estimatedCompletionDate: '2025-09-30T00:00:00Z'
          }
        ]
      },
      skillAssessments: [
        {
          skill: 'HTML',
          level: 'Advanced',
          lastAssessed: '2025-04-10T00:00:00Z'
        },
        {
          skill: 'CSS',
          level: 'Advanced',
          lastAssessed: '2025-04-10T00:00:00Z'
        },
        {
          skill: 'JavaScript',
          level: 'Intermediate',
          lastAssessed: '2025-05-18T00:00:00Z'
        },
        {
          skill: 'React',
          level: 'Beginner',
          lastAssessed: '2025-05-18T00:00:00Z'
        }
      ],
      mentorshipNotes: 'Alex is making good progress with JavaScript concepts but needs more practice with promises and async programming. Showing great potential in front-end development. Consider accelerating React introduction based on interest and progress.'
    };
    
    return NextResponse.json({ mentee });
  } catch (error) {
    console.error('Error fetching mentee data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Update mentorship notes or learning path for a mentee
export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only mentors can access this endpoint
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Only mentors can access this resource.' }, { status: 403 });
    }
    
    // Parse request body
    const data = await req.json();
    const { menteeId, action, notes, learningPath } = data;
    
    if (!menteeId || !action) {
      return NextResponse.json({ error: 'Mentee ID and action are required' }, { status: 400 });
    }
    
    // Handle different actions
    if (action === 'updateNotes') {
      if (!notes) {
        return NextResponse.json({ error: 'Notes are required for updateNotes action' }, { status: 400 });
      }
      
      // In a production environment, this would update the database
      return NextResponse.json({
        success: true,
        message: 'Mentorship notes updated successfully',
        menteeId,
        notes
      });
    } else if (action === 'updateLearningPath') {
      if (!learningPath) {
        return NextResponse.json({ error: 'Learning path data is required for updateLearningPath action' }, { status: 400 });
      }
      
      // In a production environment, this would update the database
      return NextResponse.json({
        success: true,
        message: 'Learning path updated successfully',
        menteeId,
        learningPath
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating mentee data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
