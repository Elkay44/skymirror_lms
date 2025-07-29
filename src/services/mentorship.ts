import { MentorshipRequest } from '@/types/mentorship';

export interface Mentor {
  id: string;
  name: string;
  image?: string;
  role: string;
  bio: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  languages: string[];
  availability: {
    days: string[];
    timeRange: string;
  };
  experience: string;
  education: string;
  sessionRate: number;
  responseTime: string;
  isAvailable: boolean;
  sessionTypes: string[];
}

const API_BASE = '/api';

interface ApiMentor {
  id: string;
  name: string;
  title: string;
  company: string;
  image?: string;
  bio: string;
  specialties: string[];
  rating: number;
  reviews: number;
}

export async function fetchMentors(): Promise<Mentor[]> {
  try {
    console.log('Fetching mentors from API...');
    const response = await fetch('/api/mentors', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      // Try to get a more specific error message from the response
      let errorMessage = 'Failed to fetch mentors';
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Received mentors data:', data);
    
    // Transform API response to match our frontend Mentor type
    const transformedData = Array.isArray(data) 
      ? data.map(mentor => ({
          id: mentor.id,
          name: mentor.name,
          image: mentor.user?.image || '',
          role: mentor.role,
          bio: mentor.bio || '',
          specialties: [], // The API doesn't provide specialties
          rating: mentor.rating,
          reviewCount: mentor.reviewCount,
          languages: [],
          availability: {
            days: [],
            timeRange: ''
          },
          experience: '',
          education: '',
          sessionRate: 0,
          responseTime: '',
          isAvailable: mentor.isAvailable,
          sessionTypes: []
        }))
      : [];
    
    console.log('Transformed mentors data:', transformedData);
    return transformedData;
  } catch (error: unknown) {
    console.error('Error in fetchMentors:', {
      error,
      ...(error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : {})
    });
    
    // Extract error message if it's a network error
    let errorMessage = 'Failed to fetch mentors';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    throw new Error(errorMessage);
  }
}

export async function requestMentorship(mentorId: string, message: string, userId: string): Promise<MentorshipRequest> {
  try {
    const response = await fetch('/api/mentorships', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensure session cookie is sent
      body: JSON.stringify({
        mentorId,
        title: 'Mentorship Request',
        description: 'Student mentorship request',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        duration: 60, // 60 minutes
        notes: message,
        menteeId: userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to request mentorship');
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
    const response = await fetch(`${API_BASE}/mentorships?role=student`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch mentorships' }));
      throw new Error(error.error || 'Failed to fetch mentorships');
    }
    const data = await response.json();
    
    // Transform API response to match our frontend MentorshipRequest type
    return data.map((item: any) => ({
      id: item.id,
      mentor: {
        id: item.mentorId,
        name: item.mentor?.name || null,
        image: item.mentor?.image || null,
        email: item.mentor?.email || '',
        bio: item.mentor?.bio || '',
        specialties: item.mentor?.specialties || [],
        experience: item.mentor?.experience || '',
        availability: item.mentor?.availability || '',
        isActive: item.mentor?.isActive || false
      },
      status: item.status?.toLowerCase() || 'pending',
      requestedDate: new Date(item.createdAt),
      messages: [],
      scheduledSessions: [],
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
      duration: item.duration,
      meetingUrl: item.meetingUrl,
      notes: item.notes,
      mentee: {
        id: item.menteeId,
        name: item.mentee?.name || null,
        image: item.mentee?.image || null,
        email: item.mentee?.email || '',
        bio: item.mentee?.bio || '',
        learningGoals: item.mentee?.learningGoals || '',
        interests: item.mentee?.interests || '',
        goals: item.mentee?.goals || '',
        preferredLearningStyle: item.mentee?.preferredLearningStyle || ''
      },
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));
  } catch (error) {
    console.error('Error in fetchMyMentorships:', error);
    throw error;
  }
}

export async function cancelMentorshipRequest(requestId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/mentorships/${requestId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to cancel request');
    }
  } catch (error) {
    console.error('Error in cancelMentorshipRequest:', error);
    throw error;
  }
}
