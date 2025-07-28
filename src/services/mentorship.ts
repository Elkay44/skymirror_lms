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
    const response = await fetch(`${API_BASE}/mentors`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch mentors');
    }
    const data: ApiMentor[] = await response.json();
    
    // Transform API response to match our frontend Mentor type
    return data.map(mentor => ({
      id: mentor.id,
      name: mentor.name,
      image: mentor.image,
      role: mentor.title,
      bio: mentor.bio,
      specialties: mentor.specialties,
      rating: mentor.rating,
      reviewCount: mentor.reviews,
      languages: ['English'], // Default value, adjust as needed
      availability: {
        days: ['Monday', 'Wednesday', 'Friday'], // Default value
        timeRange: '9:00 AM - 5:00 PM' // Default value
      },
      experience: '5+ years', // Default value
      sessionRate: 50, // Default value
      education: 'MSc in Computer Science', // Default value
      isAvailable: true, // Default value
      sessionTypes: ['video', 'audio'], // Default value
      responseTime: 'Within 24 hours' // Default value
    }));
  } catch (error) {
    console.error('Error in fetchMentors:', error);
    throw error;
  }
}

export async function requestMentorship(mentorId: string, message: string): Promise<MentorshipRequest> {
  try {
    if (!mentorId) {
      throw new Error('Mentor ID is required');
    }

    const requestBody = {
      mentorId,
      notes: message, // Backend expects 'notes' instead of 'message'
    };

    console.log('Sending mentorship request with data:', requestBody);
    
    const response = await fetch(`${API_BASE}/mentorships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensure cookies are sent with the request
      body: JSON.stringify(requestBody),
    });
    
    const responseData = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.error('Mentorship request failed:', {
        status: response.status,
        statusText: response.statusText,
        response: responseData,
      });
      
      throw new Error(
        responseData.message || 
        responseData.error || 
        `Failed to send mentorship request: ${response.status} ${response.statusText}`
      );
    }
    
    console.log('Mentorship request successful:', responseData);
    
    // Transform API response to match our frontend MentorshipRequest type
    return {
      id: responseData.id,
      mentor: {
        id: responseData.mentor?.id || mentorId,
        name: responseData.mentor?.name || 'Mentor',
        image: responseData.mentor?.image
      },
      status: responseData.status || 'pending',
      requestedDate: new Date(responseData.requestedDate || new Date()),
      messages: responseData.messages || [],
      scheduledSessions: responseData.scheduledSessions || []
    };
  } catch (error) {
    console.error('Error in requestMentorship:', {
      error,
      mentorId,
      message: message.length > 50 ? message.substring(0, 50) + '...' : message,
    });
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while sending the mentorship request');
  }
}

export async function fetchMyMentorships(): Promise<MentorshipRequest[]> {
  try {
    const response = await fetch(`${API_BASE}/mentorships?role=student`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch mentorships');
    }
    const data = await response.json();
    
    // Transform API response to match our frontend MentorshipRequest type
    return data.map((item: any) => ({
      id: item.id,
      mentor: {
        id: item.mentor?.id || '',
        name: item.mentor?.name || 'Unknown Mentor',
        image: item.mentor?.image
      },
      status: item.status?.toLowerCase() || 'pending',
      requestedDate: new Date(item.requestedDate || new Date()),
      messages: item.messages || [],
      scheduledSessions: item.scheduledSessions || [],
      lastMessage: item.lastMessage ? {
        content: item.lastMessage.content,
        timestamp: new Date(item.lastMessage.timestamp),
        isRead: item.lastMessage.isRead
      } : undefined
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
