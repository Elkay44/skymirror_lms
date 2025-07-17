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
  sessionRate: number;
  education: string;
  isAvailable: boolean;
  location?: string;
  timezone?: string;
  sessionTypes: Array<'video' | 'audio' | 'in-person'>;
  responseTime?: string;
}

export interface MentorshipRequest {
  id: string;
  mentor: {
    id: string;
    name: string;
    image?: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  requestedDate: Date | string;
  messages: Array<{
    id: string;
    sender: 'mentor' | 'student';
    content: string;
    timestamp: Date | string;
  }>;
  scheduledSessions?: Array<{
    id: string;
    date: Date | string;
    status: 'scheduled' | 'completed' | 'cancelled';
    meetingLink?: string;
  }>;
  lastMessage?: {
    content: string;
    timestamp: Date | string;
    isRead: boolean;
  };
}
