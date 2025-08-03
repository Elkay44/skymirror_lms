import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Helper function to generate a random API key
function generateApiKey(role: string): string {
  const prefix = role === 'INSTRUCTOR' ? 'sk_inst_' : 'sk_ment_';
  const randomStr = () => Math.random().toString(36).substring(2, 15);
  return prefix + randomStr() + randomStr() + randomStr();
}

// GET: Fetch API keys for the current user
export async function GET() {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and mentors can have API keys
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'API keys are only available for instructors and mentors' }, { status: 403 });
    }
    
    // In a real application, this would fetch from a database
    // For now, return mock data based on the user's role
    const mockApiKeys = [];
    
    if (session.user.role === 'INSTRUCTOR') {
      mockApiKeys.push(
        {
          id: 'key_1',
          name: 'Course Builder App',
          key: 'sk_inst_' + '•'.repeat(40), // Masked for security
          createdAt: '2025-04-01T10:30:00Z',
          lastUsed: '2025-05-20T14:25:18Z',
          expiresAt: '2026-04-01T10:30:00Z',
          permissions: ['read:courses', 'write:courses', 'read:students'],
          status: 'active'
        },
        {
          id: 'key_2',
          name: 'Analytics Dashboard',
          key: 'sk_inst_' + '•'.repeat(40),
          createdAt: '2025-03-15T08:45:00Z',
          lastUsed: '2025-05-24T09:12:33Z',
          expiresAt: null,
          permissions: ['read:courses', 'read:analytics', 'read:students'],
          status: 'active'
        }
      );
    } else { // MENTOR
      mockApiKeys.push(
        {
          id: 'key_1',
          name: 'Calendar Integration',
          key: 'sk_ment_' + '•'.repeat(40),
          createdAt: '2025-04-05T10:30:00Z',
          lastUsed: '2025-05-22T14:25:18Z',
          expiresAt: '2026-04-05T10:30:00Z',
          permissions: ['read:availability', 'write:availability', 'read:sessions'],
          status: 'active'
        },
        {
          id: 'key_2',
          name: 'Mentee Progress Tracker',
          key: 'sk_ment_' + '•'.repeat(40),
          createdAt: '2025-03-18T08:45:00Z',
          lastUsed: '2025-05-24T09:12:33Z',
          expiresAt: null,
          permissions: ['read:mentees', 'write:mentees', 'read:analytics'],
          status: 'active'
        }
      );
    }
    
    return NextResponse.json({ apiKeys: mockApiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new API key
export async function POST(request: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and mentors can create API keys
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'API keys are only available for instructors and mentors' }, { status: 403 });
    }
    
    // Parse request body
    const data = await request.json();
    const { name, permissions } = data;
    
    if (!name || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json({ error: 'Invalid request. Name and permissions are required.' }, { status: 400 });
    }
    
    // Generate a new API key
    const apiKey = generateApiKey(session.user.role);
    
    // Create an expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    // In a real application, this would save to a database
    // For now, return a mock response with the newly created key
    const newKey = {
      id: 'key_' + Date.now(),
      name,
      key: apiKey, // The actual key, visible only once
      createdAt: new Date().toISOString(),
      lastUsed: null,
      expiresAt: expiresAt.toISOString(),
      permissions,
      status: 'active'
    };
    
    return NextResponse.json({ success: true, apiKey: newKey });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an API key (e.g., revoke)
export async function PUT(request: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and mentors can update API keys
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'API keys are only available for instructors and mentors' }, { status: 403 });
    }
    
    // Parse request body
    const data = await request.json();
    const { id, action } = data;
    
    if (!id || !action) {
      return NextResponse.json({ error: 'Invalid request. Key ID and action are required.' }, { status: 400 });
    }
    
    if (action === 'revoke') {
      // In a real application, this would update the key status in a database
      return NextResponse.json({
        success: true,
        message: 'API key revoked successfully',
        keyId: id,
        status: 'revoked'
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
