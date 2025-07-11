import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET: Fetch detailed information about a specific mentee
export async function GET(req: NextRequest, { params }: { params: { menteeId: string } }) {
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
    
    const { menteeId } = params;
    
    if (!menteeId) {
      return NextResponse.json({ error: 'Mentee ID is required' }, { status: 400 });
    }
    
    // In a production environment, this would fetch from a database
    // For now, we'll return mock data for the specific mentee
    
    // Simulating a database lookup based on menteeId
    const mentee = {
      id: menteeId,
      name: menteeId === 'student_1' ? 'Alex Johnson' : 'Sophia Lee',
      email: menteeId === 'student_1' ? 'alex.johnson@example.com' : 'sophia.lee@example.com',
      avatar: menteeId === 'student_1' ? 'https://randomuser.me/api/portraits/men/32.jpg' : 'https://randomuser.me/api/portraits/women/44.jpg',
      enrolledCourses: [
        {
          id: menteeId === 'student_1' ? 'course_1' : 'course_3',
          title: menteeId === 'student_1' ? 'Advanced JavaScript' : 'Python Data Science',
          progress: menteeId === 'student_1' ? 68 : 45,
          lastActivity: menteeId === 'student_1' ? '2025-05-20T14:30:00Z' : '2025-05-19T09:45:00Z',
          instructor: menteeId === 'student_1' ? 'Dr. Maya Patel' : 'Dr. James Rodriguez',
          grade: menteeId === 'student_1' ? 'B+' : 'B',
          status: 'active',
          modules: [
            {
              id: 'module_1',
              title: menteeId === 'student_1' ? 'ES6 Features' : 'NumPy Fundamentals',
              progress: menteeId === 'student_1' ? 100 : 75,
              completed: menteeId === 'student_1' ? true : false,
              score: menteeId === 'student_1' ? 92 : 85
            },
            {
              id: 'module_2',
              title: menteeId === 'student_1' ? 'Async Programming' : 'Pandas Basics',
              progress: menteeId === 'student_1' ? 80 : 60,
              completed: false,
              score: menteeId === 'student_1' ? 85 : 78
            },
            {
              id: 'module_3',
              title: menteeId === 'student_1' ? 'JavaScript Design Patterns' : 'Data Visualization',
              progress: menteeId === 'student_1' ? 25 : 0,
              completed: false,
              score: null
            }
          ],
          assignments: [
            {
              id: 'assignment_1',
              title: menteeId === 'student_1' ? 'JavaScript Promises Project' : 'Pandas Data Analysis Project',
              dueDate: menteeId === 'student_1' ? '2025-06-01T23:59:00Z' : '2025-05-30T23:59:00Z',
              courseId: menteeId === 'student_1' ? 'course_1' : 'course_3',
              courseName: menteeId === 'student_1' ? 'Advanced JavaScript' : 'Python Data Science',
              submitted: false
            }
          ]
        },
        {
          id: menteeId === 'student_1' ? 'course_2' : 'course_4',
          title: menteeId === 'student_1' ? 'React Fundamentals' : 'Machine Learning Fundamentals',
          progress: menteeId === 'student_1' ? 92 : 32,
          lastActivity: menteeId === 'student_1' ? '2025-05-23T11:15:00Z' : '2025-05-22T16:20:00Z',
          instructor: menteeId === 'student_1' ? 'John Wilson' : 'Dr. Aisha Khan',
          grade: menteeId === 'student_1' ? 'A' : 'B-',
          status: 'active',
          modules: [
            {
              id: 'module_1',
              title: menteeId === 'student_1' ? 'React Basics' : 'ML Introduction',
              progress: menteeId === 'student_1' ? 100 : 80,
              completed: menteeId === 'student_1' ? true : true,
              score: menteeId === 'student_1' ? 95 : 75
            },
            {
              id: 'module_2',
              title: menteeId === 'student_1' ? 'React Hooks' : 'Supervised Learning',
              progress: menteeId === 'student_1' ? 100 : 30,
              completed: menteeId === 'student_1' ? true : false,
              score: menteeId === 'student_1' ? 98 : null
            },
            {
              id: 'module_3',
              title: menteeId === 'student_1' ? 'React Router' : 'Unsupervised Learning',
              progress: menteeId === 'student_1' ? 75 : 0,
              completed: false,
              score: null
            }
          ],
          assignments: [
            {
              id: 'assignment_2',
              title: menteeId === 'student_1' ? 'React State Management' : 'Classification Algorithms Lab',
              dueDate: menteeId === 'student_1' ? '2025-05-28T23:59:00Z' : '2025-06-05T23:59:00Z',
              courseId: menteeId === 'student_1' ? 'course_2' : 'course_4',
              courseName: menteeId === 'student_1' ? 'React Fundamentals' : 'Machine Learning Fundamentals',
              submitted: menteeId === 'student_1' ? true : false
            }
          ]
        }
      ],
      skillAssessments: [
        {
          id: 'skill_1',
          name: menteeId === 'student_1' ? 'HTML' : 'Python',
          category: menteeId === 'student_1' ? 'Front-end Development' : 'Programming Languages',
          proficiency: menteeId === 'student_1' ? 90 : 75,
          lastAssessed: menteeId === 'student_1' ? '2025-04-10T00:00:00Z' : '2025-04-15T00:00:00Z',
          recommendation: menteeId === 'student_1' ? 'Already proficient, focus on advanced topics like accessibility.' : 'Continue practicing with more complex algorithms.'
        },
        {
          id: 'skill_2',
          name: menteeId === 'student_1' ? 'CSS' : 'Data Analysis',
          category: menteeId === 'student_1' ? 'Front-end Development' : 'Data Science',
          proficiency: menteeId === 'student_1' ? 85 : 60,
          lastAssessed: menteeId === 'student_1' ? '2025-04-10T00:00:00Z' : '2025-04-15T00:00:00Z',
          recommendation: menteeId === 'student_1' ? 'Work on responsive design and animations.' : 'Focus on mastering Pandas and data cleaning techniques.'
        },
        {
          id: 'skill_3',
          name: menteeId === 'student_1' ? 'JavaScript' : 'Statistics',
          category: menteeId === 'student_1' ? 'Programming Languages' : 'Data Science',
          proficiency: menteeId === 'student_1' ? 68 : 40,
          lastAssessed: menteeId === 'student_1' ? '2025-05-18T00:00:00Z' : '2025-05-10T00:00:00Z',
          recommendation: menteeId === 'student_1' ? 'Focus on async programming and promises.' : 'This is a critical area for improvement. Consider additional resources.'
        },
        {
          id: 'skill_4',
          name: menteeId === 'student_1' ? 'React' : 'Machine Learning',
          category: menteeId === 'student_1' ? 'Front-end Frameworks' : 'Data Science',
          proficiency: menteeId === 'student_1' ? 45 : 25,
          lastAssessed: menteeId === 'student_1' ? '2025-05-18T00:00:00Z' : '2025-05-10T00:00:00Z',
          recommendation: menteeId === 'student_1' ? 'Continue with current course, good progress.' : 'Consider focusing on fundamentals before advancing.'
        }
      ],
      mentorshipSessions: [
        {
          id: 'session_1',
          date: '2025-04-15T15:00:00Z',
          duration: 60,
          topic: menteeId === 'student_1' ? 'Introduction and Goal Setting' : 'Data Science Career Paths',
          notes: 'Initial meeting went well. Set learning goals for the next 3 months.',
          status: 'completed',
          feedbackProvided: true,
          medium: 'video'
        },
        {
          id: 'session_2',
          date: '2025-05-01T15:00:00Z',
          duration: 45,
          topic: menteeId === 'student_1' ? 'JavaScript Progress Review' : 'Python Skills Assessment',
          notes: 'Reviewed current progress. Provided resources for areas of improvement.',
          status: 'completed',
          feedbackProvided: true,
          medium: 'video'
        },
        {
          id: 'session_3',
          date: menteeId === 'student_1' ? '2025-05-27T15:00:00Z' : '2025-05-26T11:00:00Z',
          duration: menteeId === 'student_1' ? 60 : 45,
          topic: menteeId === 'student_1' ? 'Career Growth Planning' : 'Data Science Project Review',
          status: 'scheduled',
          medium: 'video'
        }
      ],
      nextSession: {
        id: 'session_3',
        date: menteeId === 'student_1' ? '2025-05-27T15:00:00Z' : '2025-05-26T11:00:00Z',
        duration: menteeId === 'student_1' ? 60 : 45,
        topic: menteeId === 'student_1' ? 'Career Growth Planning' : 'Data Science Project Review'
      },
      learningPath: menteeId === 'student_1' ? 'Front-end Development' : 'Data Science',
      mentorshipNotes: menteeId === 'student_1' 
        ? 'Alex is making good progress with JavaScript concepts but needs more practice with promises and async programming. Showing great potential in front-end development.'
        : 'Sophia is struggling with statistics concepts. Recommended additional resources and practice problems. Excelling in Python programming basics.'
    };
    
    return NextResponse.json({ mentee });
  } catch (error) {
    console.error('Error fetching mentee data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update specific information about a mentee (like notes, learning path, etc.)
export async function PATCH(req: NextRequest, { params }: { params: { menteeId: string } }) {
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
    
    const { menteeId } = params;
    const data = await req.json();
    
    if (!menteeId) {
      return NextResponse.json({ error: 'Mentee ID is required' }, { status: 400 });
    }
    
    // Validate the update data
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Valid update data is required' }, { status: 400 });
    }
    
    // Handle different types of updates
    // In a production environment, this would update the database
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Mentee information updated successfully',
      menteeId,
      updatedFields: Object.keys(data)
    });
  } catch (error) {
    console.error('Error updating mentee data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
