import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

export async function PUT(request: NextRequest, { params }: { params: { menteeId: string } }) {
  try {
    // Get the authenticated user session
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user is a mentor
    // This would typically check the user's role in your database
    // For now, we'll simulate this check
    const isMentor = true; // Replace with actual role check
    
    if (!isMentor) {
      return NextResponse.json({ error: 'Access denied. Only mentors can update mentee notes.' }, { status: 403 });
    }
    
    const { menteeId } = params;
    const { notes } = await request.json();
    
    if (typeof notes !== 'string') {
      return NextResponse.json({ error: 'Invalid notes format' }, { status: 400 });
    }
    
    // Here you would save the notes to your database
    // For demonstration, we'll just simulate a successful save
    
    // Example database update:
    // await prisma.mentorNotes.upsert({
    //   where: {
    //     mentorId_menteeId: {
    //       mentorId: session.user.id,
    //       menteeId
    //     }
    //   },
    //   update: {
    //     notes
    //   },
    //   create: {
    //     mentorId: session.user.id,
    //     menteeId,
    //     notes
    //   }
    // });
    
    return NextResponse.json({
      success: true,
      message: 'Notes updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating mentee notes:', error);
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { menteeId: string } }) {
  try {
    // Get the authenticated user session
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user is a mentor
    // This would typically check the user's role in your database
    const isMentor = true; // Replace with actual role check
    
    if (!isMentor) {
      return NextResponse.json({ error: 'Access denied. Only mentors can access mentee notes.' }, { status: 403 });
    }
    
    const { menteeId } = params;
    
    // Here you would fetch the notes from your database
    // For demonstration, we'll just return sample notes
    
    // Example database query:
    // const mentorNotes = await prisma.mentorNotes.findUnique({
    //   where: {
    //     mentorId_menteeId: {
    //       mentorId: session.user.id,
    //       menteeId
    //     }
    //   }
    // });
    
    // const notes = mentorNotes?.notes || '';
    
    // For demonstration:
    const notes = 'Sample mentee notes. The student is showing great progress in React and NextJS.';
    
    return NextResponse.json({
      success: true,
      notes
    });
    
  } catch (error) {
    console.error('Error fetching mentee notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
