export interface Participant {
  id: string;
  name?: string | null;
  email?: string | null;
  role: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR';
  isOnline?: boolean;
  avatar?: string | null;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR';
  timestamp: Date;
  isRead: boolean;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
  size: number;
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
  isGroupChat: boolean;
  courseName?: string;
  updatedAt?: Date;
}

export interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  recipient: {
    name: string;
    role: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR';
  };
  isLoading: boolean;
}
