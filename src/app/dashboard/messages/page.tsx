"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageSquare, PlusCircle, Users } from 'lucide-react';
import ConversationList, { Conversation, Participant } from '@/components/messaging/ConversationList';
import MessageThread, { Message, Attachment } from '@/components/messaging/MessageThread';

interface RecipientUser {
  id: string;
  name: string;
  role: "STUDENT" | "INSTRUCTOR" | "MENTOR";
}

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

  // Recipient selection state for New Conversation modal
  const [recipients, setRecipients] = useState<RecipientUser[]>([]);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  
  // Get mentor ID from URL if provided (from Find Mentor page)
  const mentorId = searchParams.get('mentor');
  
  // Check if user is authenticated, redirect to login if not
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch recipients for New Conversation modal
  useEffect(() => {
    if (!showNewMessageModal) return;
    setRecipientLoading(true);
    setRecipientError(null);
    setRecipients([]);
    fetch('/api/users')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch recipients');
        const data = await res.json();
        // Expecting data.users: Array<{ id, name, role }>
        setRecipients(
  (data.users || [])
    .filter((u: any) => u.id !== session?.user?.id)
    .map((u: any) => ({
      id: u.id,
      name: u.name,
      role: (u.role as "STUDENT" | "INSTRUCTOR" | "MENTOR")
    }))
);
      })
      .catch((err) => setRecipientError(err.message || 'Failed to load recipients'))
      .finally(() => setRecipientLoading(false));
  }, [showNewMessageModal, session?.user?.id]);
  
  // Function to start a new conversation with a mentor
  const startNewConversationWithMentor = async (mentorId: string) => {
    try {
      // First, find the mentorship that includes this mentor and the current user
      const mentorshipsResponse = await fetch('/api/mentorships');
      if (!mentorshipsResponse.ok) {
        throw new Error('Failed to fetch mentorships');
      }
      
      const mentorships = await mentorshipsResponse.json();
      const mentorship = Array.isArray(mentorships) 
        ? mentorships.find((m: any) => m.mentor.userId === mentorId || m.student.userId === mentorId)
        : null;
      
      if (!mentorship) {
        throw new Error('No mentorship found with this mentor');
      }
      
      // Create a new conversation in this mentorship
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorshipId: mentorship.id,
          topic: 'New Conversation with Mentor'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      
      // Refetch conversations
      const conversationsResponse = await fetch('/api/conversations');
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        setConversations(Array.isArray(conversationsData) ? conversationsData : []);
      }

      // Set active conversation to the new one
      setActiveConversationId(data.id);
    } catch (err) {
      console.error('Error creating conversation with mentor:', err);
      setError('Failed to create conversation with mentor. Please try again later.');
    }
  };
  
  // Fetch conversations from API
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching conversations from /api/conversations...');
        const response = await fetch('/api/conversations');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch conversations: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Received conversations data:', data);
        setConversations(Array.isArray(data) ? data : []);
        
        // If there's a mentorId in the URL and the user is logged in,
        // check if a conversation already exists with that mentor
        if (mentorId && session?.user?.id) {
          const mentorExists = Array.isArray(data) && data.some(
            (conv: any) => {
              const participants = conv.participants || [];
              return participants.some((p: any) => p.id === mentorId);
            }
          );
          
          if (!mentorExists) {
            console.log('No existing conversation with mentor, starting new one...');
            startNewConversationWithMentor(mentorId);
          }
        }
        
        if (session?.user?.id) {
          setCurrentUserId(session.user.id);
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error('Error fetching conversations:', {
            message: err.message,
            stack: err.stack,
            name: err.name,
            cause: (err as any).cause
          });
        } else {
          console.error('Unexpected error:', err);
        }
        setError('Failed to load conversations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session?.user) {
      fetchConversations();
    }
  }, [session, mentorId]);
  
  // Fetch messages when active conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/conversations/${activeConversationId}/messages`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }
        
        const conversation = await response.json();
        setMessages(conversation.messages || []);
        
        // Update URL with active conversation
        router.push(`/dashboard/messages?conversation=${activeConversationId}`, { scroll: false });
        
        // Update conversations to mark as read
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === activeConversationId
              ? { 
                  ...conv, 
                  unreadCount: 0, 
                  lastMessage: conv.lastMessage ? { ...conv.lastMessage, isRead: true } : conv.lastMessage 
                }
              : conv
          )
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
  
  type UserRole = "STUDENT" | "INSTRUCTOR" | "MENTOR";
  type RecipientRole = UserRole | "GROUP" | undefined;

  const getPrimaryRecipient = (): { name: string; role: RecipientRole } => {
    if (!activeConversation) {
      return { name: '', role: undefined };
    }
    
    // For group chats, return the conversation name
    if (activeConversation.isGroupChat && activeConversation.courseName) {
      return {
        name: activeConversation.courseName,
        role: 'GROUP',
      };
    }
    
    // For 1:1 conversations, get the other participant
    const otherParticipants = activeConversation.participants.filter(
      (participant: Participant) => participant.id !== currentUserId
    );
    
    if (otherParticipants.length === 0) {
      return { name: '', role: undefined };
    }
    
    // Validate role
    const validRoles: UserRole[] = ["STUDENT", "INSTRUCTOR", "MENTOR"];
    const role = otherParticipants[0].role;
    return {
      name: otherParticipants[0].name || '',
      role: validRoles.includes(role as UserRole) ? (role as UserRole) : undefined,
    };
  };
  
  // Handle sending a new message
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!activeConversationId || !content.trim()) return;
    
    try {
      const response = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          isSystem: false,
          attachments: attachments ? attachments.map(file => ({
            id: Math.random().toString(36).substring(2, 15),
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
          })) : []
        })
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
      setError('Failed to send message. Please try again.');
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
      // First, find or create a mentorship that includes this user and the recipient
      const mentorshipsResponse = await fetch('/api/mentorships');
      if (!mentorshipsResponse.ok) {
        throw new Error('Failed to fetch mentorships');
      }
      
      const mentorships = await mentorshipsResponse.json();
      let mentorship = Array.isArray(mentorships) 
        ? mentorships.find((m: any) => 
            (m.mentor.userId === session?.user.id && m.student.userId === recipientId) ||
            (m.mentor.userId === recipientId && m.student.userId === session?.user.id)
          )
        : null;
      
      // If no existing mentorship, create one (or handle this case as needed)
      if (!mentorship) {
        // Note: In a real app, you might want to create a mentorship first
        throw new Error('No existing mentorship found. Please establish a mentorship first.');
      }
      
      // Create a new conversation in this mentorship
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorshipId: mentorship.id,
          topic: 'New Conversation'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create conversation');
      }

      const data = await response.json();
      
      // Refetch conversations
      const conversationsResponse = await fetch('/api/conversations');
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        setConversations(Array.isArray(conversationsData) ? conversationsData : []);
      }

      // Set active conversation to the new one
      setActiveConversationId(data.id);
      
      // Close the new conversation modal if open
      setShowNewMessageModal(false);
    } catch (err) {
      console.error('Error creating conversation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
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
          
          {error && conversations.length === 0 ? (
            <div className="bg-yellow-50 text-yellow-700 rounded px-4 py-2 mb-4">
              No conversations yet. Start a new conversation to begin messaging!
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-800 rounded px-4 py-2 mb-4">
              {error}
            </div>
          ) : null}
          
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
                  (() => {
                    const primaryRecipient = getPrimaryRecipient();
                    const validRoles: UserRole[] = ["STUDENT", "INSTRUCTOR", "MENTOR"];
                    const recipientRoleProp = validRoles.includes(primaryRecipient.role as UserRole)
                      ? (primaryRecipient.role as UserRole)
                      : "STUDENT";
                    return (
                      <MessageThread 
                        messages={messages}
                        currentUserId={currentUserId}
                        onSendMessage={handleSendMessage}
                        recipientName={primaryRecipient.name}
                        recipientRole={recipientRoleProp}
                        isGroupChat={activeConversation.isGroupChat || false}
                        courseName={activeConversation.courseName}
                        isLoading={isLoading}
                      />
                    );
                  })()
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
                            const message = formData.get('message') as string;
                            if (selectedRecipientId && message) {
                              startConversation(selectedRecipientId, message);
                            }
                          }}
                        >
                          <div className="mb-4">
                            <label htmlFor="recipientId" className="block text-sm font-medium text-gray-700">
                              Select Recipient
                            </label>
                             {recipientLoading ? (
                              <div className="text-sm text-gray-500">Loading recipients...</div>
                            ) : recipientError ? (
                              <div className="text-sm text-red-600">{recipientError}</div>
                            ) : (
                              <select
                                id="recipientId"
                                name="recipientId"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                required
                                value={selectedRecipientId}
                                onChange={e => setSelectedRecipientId(e.target.value)}
                              >
                                <option value="">-- Select a recipient --</option>
                                {recipients.map((user: RecipientUser) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name} ({user.role.charAt(0) + user.role.slice(1).toLowerCase()})
                                  </option>
                                ))}
                              </select>
                            )}

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
