export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR';
  senderAvatar?: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video';
  url: string;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string; // For video/image previews
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR';
  avatar?: string;
  avatarUrl?: string; // Alias for avatar for backward compatibility
  isOnline?: boolean;
}

export interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: {
    content: string;
    timestamp: Date;
    senderId: string;
    isRead: boolean;
  };
  unreadCount: number;
  isGroupChat?: boolean;
  courseId?: string;
  courseName?: string;
}

export interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, attachments?: File[]) => void;
  recipientName: string;
  recipientRole: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR';
  isGroupChat?: boolean;
  courseName?: string;
  isLoading: boolean;
}

export interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}
