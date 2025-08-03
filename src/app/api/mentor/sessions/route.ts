import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET: Fetch all sessions for the logged-in mentor
export async function GET(_req: Request) {
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
    const mentorSessions = [
      {
        id: 'session_1',
        menteeId: 'mentee_1',
        menteeName: 'Alex Johnson',
        menteeAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        duration: 45,
        topic: 'Career Planning Discussion',
        type: 'CAREER_PLANNING',
        status: 'SCHEDULED',
        notes: 'Discuss long-term career goals and create a roadmap for the next 2 years.'
      },
      {
        id: 'session_2',
        menteeId: 'mentee_2',
        menteeName: 'Sophia Lee',
        menteeAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        duration: 30,
        topic: 'Python Project Review',
        type: 'PROJECT_REVIEW',
        status: 'SCHEDULED',
        notes: 'Review current progress on data analysis project and provide feedback.'
      },
      {
        id: 'session_3',
        menteeId: 'mentee_1',
        menteeName: 'Alex Johnson',
        menteeAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        duration: 60,
        topic: 'JavaScript Fundamentals',
        type: 'ONE_ON_ONE',
        status: 'COMPLETED',
        notes: 'Covered core JavaScript concepts including promises, async/await, and closures.'
      },
      {
        id: 'session_4',
        menteeId: 'mentee_2',
        menteeName: 'Sophia Lee',
        menteeAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        duration: 20,
        topic: 'Quick Check-in',
        type: 'GENERAL_GUIDANCE',
        status: 'COMPLETED',
        notes: 'Brief check-in on current progress and answered questions about course material.'
      },
      {
        id: 'session_5',
        menteeId: 'mentee_1',
        menteeName: 'Alex Johnson',
        menteeAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        duration: 45,
        topic: 'Resume Review',
        type: 'CAREER_PLANNING',
        status: 'CANCELLED',
        notes: 'Session cancelled due to scheduling conflict.'
      }
    ];
    
    return NextResponse.json({ sessions: mentorSessions });
  } catch (error) {
    console.error('Error fetching mentor sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new mentorship session
export async function POST(req: Request) {
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
    const { menteeId, date, topic, type, notes, duration } = data;
    
    // Validate required fields
    if (!menteeId || !date || !topic || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // In a production environment, this would create a session in the database
    // For now, we'll just return success with the created session data
    const newSession = {
      id: `session_${Date.now()}`,
      menteeId,
      // In a real application, you would fetch these from the database based on menteeId
      menteeName: menteeId === 'mentee_1' ? 'Alex Johnson' : 'Sophia Lee',
      menteeAvatar: menteeId === 'mentee_1' 
        ? 'https://randomuser.me/api/portraits/men/32.jpg' 
        : 'https://randomuser.me/api/portraits/women/44.jpg',
      date,
      duration: duration || 30, // Default to 30 minutes if not specified
      topic,
      type,
      status: 'SCHEDULED',
      notes: notes || '',
      mentorId: session.user.id, // In a real app, this would be the mentor's ID
    };
    
    return NextResponse.json({
      success: true,
      message: 'Session scheduled successfully',
      session: newSession
    });
  } catch (error) {
    console.error('Error creating mentorship session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
