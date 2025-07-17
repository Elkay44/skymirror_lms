import React from 'react';
import { MessageSquare, Video, UserCheck, BookOpen, Search } from 'lucide-react';

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

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR';
  isOnline?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  searchQuery,
  onSearchChange
}: ConversationListProps) {
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search in participant names
    const matchesParticipants = conversation.participants.some(participant =>
      participant.name.toLowerCase().includes(query)
    );
    
    // Search in last message
    const matchesLastMessage = conversation.lastMessage.content.toLowerCase().includes(query);
    
    // Search in course name if it exists
    const matchesCourse = conversation.courseName 
      ? conversation.courseName.toLowerCase().includes(query) 
      : false;
    
    return matchesParticipants || matchesLastMessage || matchesCourse;
  });
  
  // Get the primary participant (not the current user)
  const getPrimaryParticipant = (conversation: Conversation) => {
    // Return a default participant if participants array is empty or undefined
    if (!conversation.participants || conversation.participants.length === 0) {
      return {
        id: 'unknown',
        name: 'Unknown User',
        role: 'STUDENT' as const,
        isOnline: false
      };
    }
    
    // In a real app, we would filter out the current user
    // For demo purposes, just return the first participant
    return conversation.participants[0];
  };
  
  // Format timestamp to display time or date
  const formatTime = (date?: Date | null) => {
    // Return empty string if date is not provided or invalid
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (messageDate.getTime() === today.getTime()) {
        // Today, show time
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      } else if (messageDate.getTime() === yesterday.getTime()) {
        // Yesterday
        return 'Yesterday';
      } else {
        // Older, show date
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  
  // Get appropriate icon based on conversation type
  const getConversationIcon = (conversation: Conversation) => {
    if (conversation.isGroupChat && conversation.courseId) {
      return <BookOpen className="h-5 w-5 text-blue-500" />;
    }
    
    const primaryParticipant = getPrimaryParticipant(conversation);
    
    if (primaryParticipant.role === 'MENTOR') {
      return <UserCheck className="h-5 w-5 text-green-500" />;
    } else if (primaryParticipant.role === 'INSTRUCTOR') {
      return <Video className="h-5 w-5 text-purple-500" />;
    } else {
      return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get role-based color for text and background
  const getRoleStyles = (role: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR') => {
    switch (role) {
      case 'STUDENT':
        return {
          text: 'text-blue-700',
          bg: 'bg-blue-100'
        };
      case 'INSTRUCTOR':
        return {
          text: 'text-purple-700',
          bg: 'bg-purple-100'
        };
      case 'MENTOR':
        return {
          text: 'text-teal-700',
          bg: 'bg-teal-100'
        };
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Messages</h2>
        <div className="mt-2 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => {
              const primaryParticipant = getPrimaryParticipant(conversation);
              const isActive = activeConversationId === conversation.id;
              const roleStyles = getRoleStyles(primaryParticipant.role);
              
              return (
                <li 
                  key={conversation.id}
                  className={`cursor-pointer hover:bg-gray-50 ${isActive ? 'bg-gray-50' : ''}`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center">
                      <div className="min-w-0 flex-1 flex items-center">
                        <div className="flex-shrink-0 relative">
                          {primaryParticipant.avatarUrl ? (
                            <img 
                              className="h-10 w-10 rounded-full" 
                              src={primaryParticipant.avatarUrl} 
                              alt={primaryParticipant.name} 
                            />
                          ) : (
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${roleStyles.bg}`}>
                              <span className={`text-sm font-medium ${roleStyles.text}`}>
                                {primaryParticipant.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          {primaryParticipant.isOnline && (
                            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 px-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.isGroupChat 
                                ? (conversation.courseName || 'Group Chat') 
                                : primaryParticipant.name}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessage.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                              {getConversationIcon(conversation)}
                              <span className="ml-1">
                                {conversation.lastMessage.content}
                              </span>
                            </p>
                            {conversation.unreadCount > 0 && (
                              <div className="ml-2 flex-shrink-0">
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-xs font-medium text-blue-800">
                                  {conversation.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                          {conversation.courseId && (
                            <p className="mt-1 text-xs text-gray-500">
                              Course: {conversation.courseName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try different search terms' : 'Start a new conversation'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
