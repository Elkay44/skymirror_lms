export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MentorProfile {
  id: string;
  userId: string;
  bio: string | null;
  specialties: string | null;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface StudentProfile {
  id: string;
  userId: string;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export type MentorSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MentorSession {
  id: string;
  mentorId: string;
  menteeId: string;
  title: string;
  description: string | null;
  status: MentorSessionStatus;
  scheduledAt: Date;
  duration: number;
  meetingUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  mentor: MentorProfile;
  mentee: StudentProfile;
}

export interface Mentor {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  bio: string | null;
  specialties: string | null;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormattedMentorSession {
  id: string;
  title: string;
  description: string | null;
  status: MentorSessionStatus;
  scheduledAt: Date;
  duration: number;
  meetingUrl: string | null;
  notes: string | null;
  mentorId: string;
  menteeId: string;
  mentor: User & {
    mentorProfile: {
      id: string;
      bio: string | null;
      specialties: string | null;
      rating: number;
      reviewCount: number;
      createdAt: Date;
      updatedAt: Date;
    }
  };
  mentee: User & {
    studentProfile: {
      id: string;
      bio: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MentorshipRequest {
  id: string;
  mentor: {
    id: string;
    name: string;
    image?: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  requestedDate: Date | string;
  messages: Array<{
    id: string;
    sender: 'MENTOR' | 'STUDENT';
    content: string;
    timestamp: Date | string;
  }>;
  scheduledSessions?: Array<{
    id: string;
    date: Date | string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    meetingUrl?: string;
  }>;
  lastMessage?: {
    content: string;
    timestamp: Date | string;
    isRead: boolean;
  };
}
