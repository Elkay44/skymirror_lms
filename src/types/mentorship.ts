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
  specialties?: string[];
  experience?: string;
  education?: string;
  sessionRate?: number;
  isAvailable?: boolean;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface StudentProfile {
  id: string;
  userId: string;
  bio: string | null;
  learningGoals: string;
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

export interface FormattedMentorSession {
  id: string;
  title: string;
  description: string | null;
  status: MentorSessionStatus;
  scheduledAt: Date;
  duration: number;
  meetingUrl: string | null;
  notes: string | null;
  mentor: {
    id: string;
    name: string | null;
    email: string;
    bio: string | null;
  };
  mentee: {
    id: string;
    name: string | null;
    email: string;
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
