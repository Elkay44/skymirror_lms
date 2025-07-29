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
    const response = await fetch(`${API_BASE}/mentors`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch mentors');
    }

    const data = await response.json();
    return data.map((mentor: ApiMentor) => ({
      id: mentor.id,
      name: mentor.name,
      image: mentor.image || '',
      role: mentor.title,
      bio: mentor.bio || '',
      specialties: mentor.specialties || [],
      rating: mentor.rating,
      reviewCount: mentor.reviews,
      languages: [],
      availability: {
        days: [],
        timeRange: ''
      },
      experience: '',
      education: '',
      sessionRate: 0,
      responseTime: '',
      isAvailable: true,
      sessionTypes: []
    }));
  } catch (error) {
    console.error('Error fetching mentors:', error);
    throw error;
  }
}

export async function requestMentorship(mentorId: string, message: string): Promise<MentorshipRequest> {
  try {
    const response = await fetch(`${API_BASE}/mentorships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        mentorId,
        message
      })
    });

    if (!response.ok) {
      throw new Error('Failed to request mentorship');
    }

    return await response.json();
  } catch (error) {
    console.error('Error requesting mentorship:', error);
    throw error;
  }
}

export async function fetchMyMentorships(): Promise<MentorshipRequest[]> {
  try {
    const response = await fetch(`${API_BASE}/mentorships?role=student`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized. Please log in to view mentorships.');
      }
      throw new Error('Failed to fetch mentorships');
    }

    const data = await response.json();
    return data.map((mentorship: any) => ({
      id: mentorship.id,
      mentor: {
        id: mentorship.mentor.id,
        name: mentorship.mentor.name,
        image: mentorship.mentor.image || undefined
      },
      status: mentorship.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED',
      requestedDate: new Date(mentorship.createdAt),
      messages: [],
      lastMessage: undefined
    }));
  } catch (error) {
    console.error('Error fetching mentorships:', error);
    throw error;
  }
}

export async function cancelMentorshipRequest(requestId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/mentorships/${requestId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to cancel mentorship request');
    }
  } catch (error) {
    console.error('Error cancelling mentorship request:', error);
    throw error;
  }
}
