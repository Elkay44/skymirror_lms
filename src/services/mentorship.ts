import { MentorshipRequest } from '@/types/mentorship';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface Mentor {
  id: string;
  name: string;
  image?: string;
  email: string;
  role: string;
  bio: string | null;
  specialties: string | null;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const API_BASE = '/api/mentorships';

interface ApiMentor {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  bio: string | null;
  specialties: string | null;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function fetchMentors(search?: string): Promise<Mentor[]> {
  try {
    const response = await fetch(`${API_BASE}/mentors?search=${encodeURIComponent(search || '')}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch mentors');
    }

    const data = await response.json();
    return data.map((mentor: ApiMentor) => ({
      ...mentor,
      createdAt: new Date(mentor.createdAt),
      updatedAt: new Date(mentor.updatedAt)
    }));
  } catch (error) {
    console.error('Error fetching mentors:', error);
    throw error;
  }
}

export interface RequestMentorshipParams {
  mentorId: string;
  description: string;
  title: string;
  scheduledAt: string;
  duration: number;
  meetingUrl?: string;
  notes?: string;
  menteeId: string;
}

export async function requestMentorship({
  mentorId,
  description,
  title,
  scheduledAt,
  duration,
  meetingUrl,
  notes,
  menteeId
}: RequestMentorshipParams): Promise<MentorshipRequest> {
  try {
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        mentorId,
        title: title || `Mentorship Session`,
        description: description || 'Mentorship session request',
        scheduledAt,
        duration: duration || 60, // Default to 60 minutes if not provided
        meetingUrl: meetingUrl || null,
        notes: notes || null,
        menteeId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to request mentorship');
    }

    const data = await response.json();
    return {
      id: data.id,
      mentor: {
        id: data.mentor.id,
        name: data.mentor.name,
        image: data.mentor.image
      },
      status: data.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED',
      requestedDate: new Date(data.createdAt),
      messages: [],
      lastMessage: undefined
    };
  } catch (error) {
    console.error('Error requesting mentorship:', error);
    throw error;
  }
}

export async function fetchMyMentorships(): Promise<MentorshipRequest[]> {
  try {
    const response = await fetch(`${API_BASE}?role=student`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Mentorship API response status:', response.status);
    console.log('Mentorship API response headers:', response.headers);
    
    // Clone the response to read it multiple times
    const responseText = await response.text();
    console.log('Mentorship API response text:', responseText);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { 
          error: 'Failed to parse error response',
          status: response.status,
          statusText: response.statusText
        };
      }
      
      console.error('Error fetching mentorships:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      if (response.status === 401) {
        throw new Error('Unauthorized. Please log in to view mentorships.');
      } else if (response.status === 400) {
        throw new Error('Invalid request: ' + (errorData.error || 'User role not found'));
      } else {
        throw new Error('Failed to fetch mentorships: ' + (errorData.error || 'Unknown error'));
      }
    }
    
    // Parse the successful response
    const data = JSON.parse(responseText);
    const sessions = data.data || [];

    if (!sessions) {
      console.error('Null response received');
      return [];
    }

    if (!Array.isArray(sessions)) {
      console.error('Invalid response format:', sessions);
      return [];
    }

    return sessions.map((session: any) => ({
      id: session.id,
      mentor: {
        id: session.mentor?.id || '',
        name: session.mentor?.name || '',
        image: session.mentor?.image || undefined
      },
      status: session.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED',
      requestedDate: new Date(session.createdAt),
      messages: session.messages || [],
      lastMessage: session.lastMessage ? {
        content: session.lastMessage.content,
        timestamp: new Date(session.lastMessage.timestamp),
        isRead: session.lastMessage.isRead
      } : undefined,
      scheduledSessions: (session.scheduledSessions || []).map((s: any) => ({
        id: s.id,
        date: new Date(s.date),
        status: s.status as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
        meetingUrl: s.meetingUrl || undefined
      }))
    })).filter((session: any) => session.id); // Filter out invalid sessions
  } catch (error) {
    console.error('Error fetching mentorships:', error);
    throw error;
  }
}

export async function cancelMentorshipRequest(requestId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${requestId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cancel mentorship request');
    }
  } catch (error) {
    console.error('Error cancelling mentorship request:', error);
    throw error;
  }
}
