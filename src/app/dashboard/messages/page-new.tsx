"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageSquare, PlusCircle } from 'lucide-react';
import ConversationList, { Conversation, Participant } from '@/components/messaging/ConversationList';
import MessageThread, { Message, Attachment } from '@/components/messaging/MessageThread';

export default function MessagesPage() {
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
        
        // Update URL with active conversation
        router.push(`/dashboard/messages?conversation=${activeConversationId}`, { scroll: false });
        
        // Update conversations to mark as read
        setConversations(prevConversations => 
          prevConversations.map(conv => {
            if (conv.id === activeConversationId) {
              if (conv.lastMessage) {
                return {
                  ...conv,
                  unreadCount: 0,
                  lastMessage: {
                    ...conv.lastMessage,
                    isRead: true
                  }
                };
              }
              return {
                ...conv,
                unreadCount: 0,
                lastMessage: {
                  content: '',
                  timestamp: new Date(),
                  senderId: '',
                  isRead: true
                }
              };
            }
            return conv;
          })
        );
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
  
  // Get active conversation object
  const activeConversation = conversations.find(conversation => conversation.id === activeConversationId);
  
  // Get primary recipient for the conversation (the other user in 1:1 conversations)
  const getPrimaryRecipient = () => {
    if (!activeConversation) {
      return { name: '', role: 'STUDENT' as const };
    }
    
    // For group chats, return the conversation name
    if (activeConversation.isGroupChat && activeConversation.courseName) {
      return { 
        name: activeConversation.courseName,
        role: 'STUDENT' as const // Default to STUDENT for group chats
      };
    }
    
    // For 1:1 conversations, get the other participant
    const otherParticipants = activeConversation.participants.filter(
      (participant: Participant) => participant.id !== currentUserId
    );
    
    if (otherParticipants.length === 0) {
      return { name: '', role: 'STUDENT' as const };
    }
    
    // Return the first other participant (in 1:1 conversations, this is the only other participant)
    return {
      name: otherParticipants[0].name || '',
      role: (otherParticipants[0].role || 'STUDENT') as 'STUDENT' | 'INSTRUCTOR' | 'MENTOR'
    };
  };
  
  // Handle sending a new message
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!activeConversationId || !content.trim()) return;
    
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      if (attachments) {
        attachments.forEach((file, index) => {
          formData.append(`attachments[${index}]`, file);
        });
      }
      
      const response = await fetch(`/api/messages/${activeConversationId}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add the new message to the messages list
      setMessages(prevMessages => [...prevMessages, data.message]);
      
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
      alert('Failed to send message. Please try again.');
    }
  };
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Check if any participant name matches the query
    const participantMatch = conversation.participants.some(participant => 
      participant.name?.toLowerCase().includes(query)
    );
    
    // Check if course name matches the query (for group chats)
    const courseMatch = conversation.courseName?.toLowerCase().includes(query);
    
    // Check if last message content matches the query
    const messageMatch = conversation.lastMessage?.content.toLowerCase().includes(query);
    
    return participantMatch || courseMatch || messageMatch;
  });
  
  // Function to create a new conversation (show modal)
  const handleNewConversation = () => {
    setShowNewMessageModal(true);
  };
  
  // Function to start a new conversation with a specific user
  const startConversation = async (recipientId: string, initialMessage: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          initialMessage
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Close modal
      setShowNewMessageModal(false);
      
      // Refetch conversations
      const conversationsResponse = await fetch('/api/messages');
      const conversationsData = await conversationsResponse.json();
      setConversations(conversationsData.conversations || []);
      
      // Set active conversation to the new one
      setActiveConversationId(data.conversationId);
    } catch (err) {
      console.error('Error creating conversation:', err);
      alert('Failed to create conversation. Please try again.');
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
              onClick={handleNewConversation}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              New Message
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {isLoading && conversations.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading conversations...</span>
            </div>
          ) : (
            <div className="flex h-[70vh] bg-white shadow overflow-hidden rounded-lg">
              {/* Conversation list */}
              <div className="w-1/3 border-r border-gray-200">
                <ConversationList 
                  conversations={filteredConversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={setActiveConversationId}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>
              
              {/* Message thread */}
              <div className="w-2/3">
                {activeConversation ? (
                  <MessageThread 
                    messages={messages}
                    currentUserId={currentUserId}
                    onSendMessage={handleSendMessage}
                    recipientName={getPrimaryRecipient().name}
                    recipientRole={getPrimaryRecipient().role}
                    isGroupChat={activeConversation.isGroupChat || false}
                    courseName={activeConversation.courseName}
                    isLoading={isLoading}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Select a conversation</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Choose a conversation from the list or start a new one.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* New Message Modal */}
        {showNewMessageModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        New Message
                      </h3>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-4">
                          Start a new conversation with a mentor or instructor.
                        </p>
                        
                        {/* Simple form to create a new conversation */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const recipientId = formData.get('recipientId') as string;
                            const message = formData.get('message') as string;
                            
                            if (recipientId && message) {
                              startConversation(recipientId, message);
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
                              {/* This would normally be populated from the API */}
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
                            >
                              Send Message
                            </button>
                            <button
                              type="button"
                              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                              onClick={() => setShowNewMessageModal(false)}
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
    </div>
  );
}
