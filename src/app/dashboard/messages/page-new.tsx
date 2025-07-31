"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageSquare, PlusCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import components with no SSR
const ConversationList = dynamic(
  () => import('@/components/messaging/ConversationList'),
  { ssr: false }
);

const MessageThread = dynamic(
  () => import('@/components/messaging/MessageThread'),
  { ssr: false }
);

// Import types from components
import type { 
  Conversation, 
  Message, 
  Participant, 
  Attachment,
  ConversationListProps,
  MessageThreadProps 
} from '@/components/messaging/types';

function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the active conversation ID from URL query parameters
  const activeConversationIdParam = searchParams.get('conversation');
  
  // State for conversations and messages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(activeConversationIdParam);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is authenticated, redirect to login if not
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Mark messages as read for a conversation
  const markMessagesAsRead = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark messages as read: ${response.status}`);
      }

      // Update the conversation's unread count locally
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Fetch conversations from API
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/messages');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch conversations: ${response.status}`);
        }
        
        const data = await response.json();
        setConversations(data.conversations || []);
        
        // Extract current user ID from the first conversation
        if (data.conversations && data.conversations.length > 0) {
          const currentUserParticipant = data.conversations[0].participants.find(
            (p: Participant) => p.role === session?.user?.role
          );
          if (currentUserParticipant) {
            setCurrentUserId(currentUserParticipant.id);
          }
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchConversations();
    }
  }, [session]);
  
  // Fetch messages when active conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/messages/${activeConversationId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }
        
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Mark messages as read when opening the conversation
        await markMessagesAsRead(activeConversationId);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user && activeConversationId) {
      fetchMessages();
    }
  }, [activeConversationId, router, session]);
  
  // Handle participant click in conversation list
  const handleParticipantClick = (participant: Participant) => {
    if (!currentUserId || !session?.user) return;
    
    // Find existing conversation with this participant
    const existingConv = conversations.find(conv => 
      conv.participants.some((p: Participant) => p.id === participant.id)
    );
    
    if (existingConv) {
      setActiveConversationId(existingConv.id);
      // Mark messages as read
      markMessagesAsRead(existingConv.id);
    } else {
      // Create a new conversation
      const userRole = (session.user as any).role || 'STUDENT';
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        participants: [participant, { 
          id: currentUserId, 
          name: session.user.name || 'Current User',
          email: session.user.email || '',
          role: userRole as 'STUDENT' | 'INSTRUCTOR' | 'MENTOR',
          isOnline: true
        }],
        lastMessage: {
          content: '',
          timestamp: new Date(),
          senderId: currentUserId,
          isRead: true
        },
        unreadCount: 0,
        isGroupChat: false,
        courseName: ''
      };
      
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
    }
    
    // Close the new message modal if open
    setShowNewMessageModal(false);
  };
  
  // Start a new conversation with a recipient
  const startConversation = async (recipientId: string, message: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting new conversation with:', { recipientId, message });
      
      // In a real app, you would fetch the recipient's details from the API
      // For now, we'll use mock data based on the selected ID
      const recipientMap: Record<string, { name: string; role: string }> = {
        'mentor1': { name: 'Sarah Johnson', role: 'MENTOR' },
        'instructor1': { name: 'Michael Lee', role: 'INSTRUCTOR' },
        'mentor2': { name: 'Elena Rodriguez', role: 'MENTOR' },
      };
      
      const recipient = recipientMap[recipientId] || { name: 'Recipient', role: 'STUDENT' };
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: recipientId,
          message: {
            content: message,
            senderId: currentUserId,
            senderName: session?.user?.name || 'User',
            senderRole: (session?.user as any)?.role || 'STUDENT',
            timestamp: new Date().toISOString(),
            isRead: false
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Failed to start conversation: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('New conversation created:', data);
      
      if (data.conversation) {
        // Update the conversations list with the new conversation
        setConversations(prev => [data.conversation, ...prev]);
        setActiveConversationId(data.conversation.id);
        setShowNewMessageModal(false);
        
        // Update URL with the new conversation ID
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('conversation', data.conversation.id);
        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
        window.history.pushState({}, '', newUrl);
      } else {
        throw new Error('No conversation data returned from server');
      }
      
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get active conversation object
  const activeConversation = conversations.find(conversation => conversation.id === activeConversationId);
  
  // Get primary recipient for the conversation
  const getPrimaryRecipient = () => {
    if (!activeConversation) {
      return { name: '', role: 'STUDENT' as const };
    }
    
    // For group chats, return the conversation name
    if (activeConversation.isGroupChat && activeConversation.courseName) {
      return { 
        name: activeConversation.courseName,
        role: 'STUDENT' as const
      };
    }
    
    // For 1:1 conversations, get the other participant
    const otherParticipants = activeConversation.participants.filter(
      (participant: Participant) => participant.id !== currentUserId
    );
    
    if (otherParticipants.length === 0) {
      return { name: '', role: 'STUDENT' as const };
    }
    
    // Return the first other participant
    const participant = otherParticipants[0];
    return {
      name: participant.name || '',
      role: (participant.role || 'STUDENT') as 'STUDENT' | 'INSTRUCTOR' | 'MENTOR'
    };
  };
  
  // Handle sending a new message
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!activeConversationId || !content.trim()) return;
    
    try {
      // Handle text message without attachments
      if (!attachments || attachments.length === 0) {
        const response = await fetch(`/api/messages/${activeConversationId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content })
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status}`);
        }
      }
      // Handle message with attachments
      else {
        const formData = new FormData();
        formData.append('content', content);
        
        attachments.forEach((file, index) => {
          formData.append(`attachments[${index}]`, file);
        });

        const response = await fetch(`/api/messages/${activeConversationId}`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status}`);
        }
      }

      // Update UI
      const userRole = (session?.user as any)?.role || 'STUDENT';
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        senderId: currentUserId,
        senderName: session?.user?.name || '',
        senderRole: userRole as 'STUDENT' | 'INSTRUCTOR' | 'MENTOR',
        timestamp: new Date(),
        isRead: true
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // Update conversation with new last message
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === activeConversationId
            ? { 
                ...conv, 
                lastMessage: { 
                  content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                  timestamp: new Date(),
                  senderId: currentUserId,
                  isRead: true
                } 
              }
            : conv
        )
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Check if any participant name matches the query
    const participantMatch = conversation.participants.some((participant: Participant) => 
      participant.name?.toLowerCase().includes(query)
    );
    
    // Check if course name matches the query (for group chats)
    const courseMatch = conversation.courseName?.toLowerCase().includes(query);
    
    // Check if last message content matches the query
    const messageMatch = conversation.lastMessage?.content.toLowerCase().includes(query);
    
    return participantMatch || courseMatch || messageMatch;
  });
  
  // Function to create a new conversation (show modal)
  const handleNewConversation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Opening new message modal');
    if (typeof window !== 'undefined') {
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
    setShowNewMessageModal(true);
  };
  
  // Close modal handler
  const handleCloseModal = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Closing new message modal');
    if (typeof window !== 'undefined') {
      document.body.style.overflow = ''; // Re-enable scrolling
    }
    setShowNewMessageModal(false);
  };
  
  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal(e);
    }
  };

  // Render a loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
            <button
              type="button"
              onClick={handleNewConversation}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              New Message
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="flex h-[calc(100vh-200px)]">
              {/* Conversation List */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : filteredConversations.length > 0 ? (
                    <div className="w-full">
                      <ConversationList
                        conversations={filteredConversations}
                        activeConversationId={activeConversationId}
                        onSelectConversation={(conversationId) => {
                          setActiveConversationId(conversationId);
                          markMessagesAsRead(conversationId);
                        }}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by sending a new message.</p>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={handleNewConversation}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                          New Message
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {activeConversationId ? (
                  <MessageThread
                    messages={messages}
                    currentUserId={currentUserId}
                    onSendMessage={handleSendMessage}
                    recipientName={getPrimaryRecipient().name}
                    recipientRole={getPrimaryRecipient().role}
                    isLoading={isLoading}
                    isGroupChat={activeConversation?.isGroupChat}
                    courseName={activeConversation?.courseName}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
                      <p className="mt-1 text-sm text-gray-500">Select a conversation or start a new one.</p>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={handleNewConversation}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                          New Message
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={handleBackdropClick}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      New Message
                    </h3>
                    <div className="mt-4">
                      {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                          {error}
                        </div>
                      )}
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const recipientId = formData.get('recipientId') as string;
                          const message = formData.get('message') as string;
                          
                          if (!recipientId) {
                            setError('Please select a recipient');
                            return;
                          }
                          
                          if (!message.trim()) {
                            setError('Please enter a message');
                            return;
                          }
                          
                          try {
                            await startConversation(recipientId, message);
                            // Reset form on success
                            (e.target as HTMLFormElement).reset();
                            setError(null);
                          } catch (err) {
                            console.error('Form submission error:', err);
                          }
                        }}
                      >
                        <div className="mb-4">
                          <label htmlFor="recipientId" className="block text-sm font-medium text-gray-700">
                            Select Recipient
                          </label>
                          <select
                            id="recipientId"
                            name="recipientId"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            required
                          >
                            <option value="">-- Select a recipient --</option>
                            <option value="mentor1">Sarah Johnson (Mentor)</option>
                            <option value="instructor1">Michael Lee (Instructor)</option>
                            <option value="mentor2">Elena Rodriguez (Mentor)</option>
                          </select>
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                            Message
                          </label>
                          <textarea
                            id="message"
                            name="message"
                            rows={4}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Type your message here..."
                            required
                          ></textarea>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Sending...' : 'Send Message'}
                          </button>
                          <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={handleCloseModal}
                            disabled={isLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;
