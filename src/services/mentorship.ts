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
    // First, get the mentor profile
    const mentorProfileResponse = await fetch(`${API_BASE}/profile/${mentorId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!mentorProfileResponse.ok) {
      const errorData = await mentorProfileResponse.json();
      throw new Error(errorData.error || 'Mentor not found');
    }

    const mentorProfileData = await mentorProfileResponse.json();
    
    // Create the mentorship request
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        mentorId: mentorProfileData.id,
        title: title || `Mentorship Session`,
        description: description || 'Mentorship session request',
        scheduledAt,
        duration: duration || 60,
        meetingUrl: meetingUrl || null,
        notes: notes || null,
        menteeId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.error === 'Student profile created successfully. Please try again.') {
        // If student profile was just created, retry the request
        return requestMentorship({
          mentorId,
          description,
          title,
          scheduledAt,
          duration,
          meetingUrl,
          notes,
          menteeId
        });
      }
      throw new Error(errorData.error || 'Failed to create mentorship request');
    }
    
    const data = await response.json();
    return data;
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch mentorships');
    }

    const data = await response.json();
    return data;
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
