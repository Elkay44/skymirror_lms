import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET: Fetch a specific session by ID
export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
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
    
    const { sessionId } = params;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // In a production environment, this would fetch the session from a database
    // For now, we'll return mock data based on the session ID
    let mockSession;
    
    if (sessionId === 'session_1') {
      mockSession = {
        id: 'session_1',
        menteeId: 'mentee_1',
        menteeName: 'Alex Johnson',
        menteeAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        menteeEmail: 'alex.johnson@example.com',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        duration: 45,
        topic: 'Career Planning Discussion',
        type: 'CAREER_PLANNING',
        status: 'SCHEDULED',
        notes: 'Discuss long-term career goals and create a roadmap for the next 2 years.',
        preparationMaterials: [
          {
            id: 'material_1',
            title: 'Career Planning Template',
            type: 'DOCUMENT',
            url: 'https://example.com/career-planning-template.pdf'
          }
        ],
        menteeProgress: {
          completedCourses: 3,
          activeCourses: 2,
          averageGrade: 'B+',
          lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    } else if (sessionId === 'session_2') {
      mockSession = {
        id: 'session_2',
        menteeId: 'mentee_2',
        menteeName: 'Sophia Lee',
        menteeAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        menteeEmail: 'sophia.lee@example.com',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        duration: 30,
        topic: 'Python Project Review',
        type: 'PROJECT_REVIEW',
        status: 'SCHEDULED',
        notes: 'Review current progress on data analysis project and provide feedback.',
        preparationMaterials: [
          {
            id: 'material_2',
            title: 'Project Requirements Document',
            type: 'DOCUMENT',
            url: 'https://example.com/project-requirements.pdf'
          },
          {
            id: 'material_3',
            title: 'Project GitHub Repository',
            type: 'LINK',
            url: 'https://github.com/sophia/data-analysis-project'
          }
        ],
        menteeProgress: {
          completedCourses: 2,
          activeCourses: 3,
          averageGrade: 'B',
          lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    } else {
      // For any other session ID, create a generic response
      mockSession = {
        id: sessionId,
        menteeId: 'mentee_3',
        menteeName: 'Generic Student',
        menteeAvatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
        menteeEmail: 'student@example.com',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        duration: 30,
        topic: 'General Mentoring Session',
        type: 'ONE_ON_ONE',
        status: 'SCHEDULED',
        notes: 'Regular check-in session to discuss progress and address any questions.',
        preparationMaterials: [],
        menteeProgress: {
          completedCourses: 1,
          activeCourses: 2,
          averageGrade: 'C+',
          lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    }
    
    return NextResponse.json({ session: mockSession });
  } catch (error) {
    console.error('Error fetching session details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update a specific session (change status, update details, etc.)
export async function PATCH(req: NextRequest, { params }: { params: { sessionId: string } }) {
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
    
    const { sessionId } = params;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Parse request body
    const data = await req.json();
    
    // Validate the update data
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Valid update data is required' }, { status: 400 });
    }
    
    // In a production environment, this would update the session in the database
    // For now, we'll just return success with the updated session data
    
    // Create a mock updated session (combining the request data with default values)
    const updatedSession = {
      id: sessionId,
      menteeId: data.menteeId || 'mentee_1',
      menteeName: data.menteeId === 'mentee_2' ? 'Sophia Lee' : 'Alex Johnson',
      menteeAvatar: data.menteeId === 'mentee_2' 
        ? 'https://randomuser.me/api/portraits/women/44.jpg' 
        : 'https://randomuser.me/api/portraits/men/32.jpg',
      date: data.date || new Date().toISOString(),
      duration: data.duration || 30,
      topic: data.topic || 'Updated Session Topic',
      type: data.type || 'ONE_ON_ONE',
      status: data.status || 'SCHEDULED',
      notes: data.notes !== undefined ? data.notes : 'Updated session notes.',
    };
    
    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Cancel/delete a session
export async function DELETE(req: NextRequest, { params }: { params: { sessionId: string } }) {
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
    
    const { sessionId } = params;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // In a production environment, this would delete or mark the session as cancelled in the database
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: 'Session cancelled successfully',
      sessionId
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
