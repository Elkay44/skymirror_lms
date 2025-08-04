'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageSquare, PlusCircle, X } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sentAt: string;
  senderName?: string;
  senderAvatar?: string | null;
  senderRole?: string;
  isRead?: boolean;
}

interface Participant {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage?: Message;
  updatedAt: string;
}

const MessagesClient = () => {
  const { data: session, status } = useSession() as any; // Temporary any type to bypass type checking
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [recipients, setRecipients] = useState<Participant[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  // Fetch recipients from the API
  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        // Check authentication status before proceeding
        if (status === 'unauthenticated') {
          console.log('User not authenticated, skipping recipients fetch');
          setError('You must be logged in to view recipients');
          router.push('/login');
          return;
        }
        
        if (status === 'loading') {
          // Wait for authentication status to resolve
          return;
        }
        
        setIsLoadingRecipients(true);
        const response = await fetch('/api/recipients', {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        });
        
        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 401) {
            console.warn('Authentication required for fetching recipients');
            setError('Authentication required. Please log in.');
            router.push('/login');
            return;
          }
          
          throw new Error(`Failed to fetch recipients: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setRecipients(data);
        } else {
          console.warn('Unexpected response format from /api/recipients:', data);
          setError('Unexpected response format from server');
          setRecipients([]);
        }
      } catch (err) {
        console.error('Error fetching recipients:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading recipients');
      } finally {
        setIsLoadingRecipients(false);
      }
    };
    
    if (showNewConversationModal) {
      fetchRecipients();
    }
  }, [showNewConversationModal, status, router]);


  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // Check authentication status
        if (status === 'unauthenticated') {
          console.log('User not authenticated, skipping conversation fetch');
          return;
        }
        
        if (status === 'loading') {
          // Wait for authentication status to resolve
          return;
        }
        
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/conversations', {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        });
        
        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 401) {
            console.warn('Authentication required for fetching conversations');
            router.push('/login');
            throw new Error('Authentication required. Please log in.');
          }
          
          throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // The API returns the conversations array directly
        if (Array.isArray(data)) {
          setConversations(data);
          return;
        }
        
        // Fallback for unexpected format
        console.warn('Unexpected response format from /api/conversations:', data);
        setError('Unexpected response format from server');
        setConversations([]);
        
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading conversations');
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversations();
  }, []);

  // Handle conversation selection
  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      // Check authentication status before proceeding
      if (status !== 'authenticated' || !session?.user) {
        setError('You must be logged in to view messages');
        router.push('/login');
        return;
      }
      
      setIsLoading(true);
      setSelectedConversation(conversation);
      
      // Fetch messages for the selected conversation
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        headers: {
          'Cache-Control': 'no-store'
        }
      });
      
      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this conversation.');
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if the response has the expected format
      if (data && data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else if (Array.isArray(data)) {
        // Fallback for direct array response
        setMessages(data);
      } else {
        console.warn('Unexpected message format:', data);
        setMessages(conversation.lastMessage ? [conversation.lastMessage] : []);
      }
      
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages. Please try again.');
      setMessages(conversation.lastMessage ? [conversation.lastMessage] : []);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle starting a new conversation
  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    
    if (!session?.user) {
      setError('You must be logged in to start a conversation.');
      setIsSubmitting(false);
      return;
    }
    
    if (!selectedRecipient) {
      setError('Please select a recipient.');
      setIsSubmitting(false);
      return;
    }
    
    if (!newMessage.trim()) {
      setError('Please enter a message.');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Starting new conversation with:', { recipientId: selectedRecipient, message: newMessage.trim() });
    
    const requestBody = {
      participantId: selectedRecipient,
      message: { content: newMessage.trim() }
    };
    console.log('Request payload:', JSON.stringify(requestBody));
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify(requestBody),
      });

      let responseData;
      try {
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        try {
          responseData = JSON.parse(responseText);
          console.log('Parsed response data:', responseData);
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          responseData = { error: 'Failed to parse server response', rawResponse: responseText };
        }
      } catch (e) {
        console.error('Error reading response:', e);
        responseData = { error: 'Failed to read server response' };
      }

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to message this user.');
        } else if (response.status === 400) {
          throw new Error(responseData.error || 'Invalid request. Please check your inputs.');
        } else if (response.status === 404) {
          throw new Error('User not found. They may have been removed from the system.');
        } else if (response.status === 500) {
          console.error('Server error details:', responseData);
          throw new Error(responseData.error || 'Server error. Please try again later.');
        }
        
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Conversation created successfully:', responseData);
      
      // Add the new conversation to the list
      setConversations(prev => [responseData, ...prev]);
      
      // Select the new conversation
      setSelectedConversation(responseData);
      
      // Reset form
      setNewMessage('');
      setSelectedRecipient('');
      setShowNewConversationModal(false);
      
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }  
  };

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for message content and selected conversation
    if (!messageInput.trim() || !selectedConversation) {
      setError('Please enter a message');
      return;
    }
    
    // Check authentication status before proceeding
    if (status !== 'authenticated' || !session?.user) {
      setError('You must be logged in to send messages');
      router.push('/login');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create message object
      const newMessage: Message = {
        id: 'temp-' + Date.now(), // Temporary ID that will be replaced by server
        content: messageInput,
        senderId: session.user.id,
        sentAt: new Date().toISOString(),
        senderName: session.user.name || 'You',
        senderAvatar: session.user.image || null,
        senderRole: session.user.role || 'STUDENT',
        isRead: true,
      };
      
      // Optimistically update the UI
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setMessageInput('');
      
      // Update the last message in the conversation list
      const updatedConversation = {
        ...selectedConversation,
        lastMessage: newMessage,
        updatedAt: new Date().toISOString(),
      };
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id ? updatedConversation : conv
        )
      );
      
      // Send the message to the server
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify({
          content: messageInput,
        }),
      });
      
      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to send messages in this conversation.');
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Update with server response if needed
      const data = await response.json();
      const sentMessage = data.message; // Extract the message from the response
      
      if (sentMessage) {
        // Replace the temporary message with the one from the server
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id ? sentMessage : msg
          )
        );
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
      
      // Revert optimistic update on error
      setMessages(messages);
      
      // Re-fetch conversations to ensure consistency
      try {
        const response = await fetch('/api/conversations', {
          headers: { 'Cache-Control': 'no-store' }
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setConversations(data);
          }
        }
      } catch (fetchError) {
        console.error('Error re-fetching conversations:', fetchError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 min-w-0">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 w-full max-w-2xl">
          <div className="flex min-w-0">
            <div className="flex-shrink-0 min-w-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 break-words">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-600 focus:outline-none focus:underline transition duration-150 ease-in-out break-words"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conversation => {
      // Check if the conversation's participant names or last message content matches the query
      const participantNames = conversation.participants
        .map(p => p.name?.toLowerCase())
        .filter(Boolean);
      
      const lastMessageContent = conversation.lastMessage?.content?.toLowerCase() || '';
      
      return (
        participantNames.some(name => name?.includes(query)) ||
        lastMessageContent.includes(query)
      );
    });
  }, [conversations, searchQuery]);

  // Handle loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 min-w-0">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">Loading your messages...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 min-w-0">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 w-full max-w-2xl">
          <div className="flex min-w-0">
            <div className="flex-shrink-0 min-w-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 break-words">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-600 focus:outline-none focus:underline transition duration-150 ease-in-out break-words"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col h-screen bg-gray-50 min-w-0">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900 break-words">Messages</h1>
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 break-words min-w-0"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              New Message
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow overflow-hidden overflow-hidden">
            <div className="flex h-[calc(100vh-200px)] min-w-0">
              {/* Sidebar */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col min-w-0">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm break-words"
                      placeholder="Search conversations"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto min-w-0">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 min-w-0">
                        <MessageSquare className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-gray-900 break-words">No conversations yet</h3>
                      <p className="mt-1 text-sm text-gray-500 break-words">
                        {isLoading 
                          ? 'Loading conversations...' 
                          : searchQuery 
                            ? 'No conversations match your search.'
                            : 'Start a new conversation to get started.'
                        }
                      </p>
                      {!isLoading && !searchQuery && (
                        <div className="mt-6">
                          <button
                            type="button"
                            onClick={() => setShowNewConversationModal(true)}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 break-words min-w-0"
                          >
                            <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                            New Message
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {filteredConversations.map((conversation) => {
                        const participant = conversation.participants[0];
                        const isActive = selectedConversation?.id === conversation.id;
                        
                        return (
                          <li key={conversation.id}>
                            <button
                              onClick={() => handleSelectConversation(conversation)}
                              className={`w-full text-left p-4 hover:bg-gray-50 focus:outline-none ${
                                isActive ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-center min-w-0">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center min-w-0">
                                  {participant?.avatarUrl ? (
                                    <img
                                      className="h-10 w-10 rounded-full"
                                      src={participant.avatarUrl}
                                      alt={participant.name || 'User'}
                                    />
                                  ) : (
                                    <span className="text-gray-700 font-medium">
                                      {(participant?.name || 'User').charAt(0)}
                                    </span>
                                  )}
                                </div>
                              
                                <div className="min-w-0 flex-1 ml-3">
                                  <div className="flex items-center">
                                    <p className="text-sm font-medium text-gray-900 truncate break-words">
                                      {conversation.participants
                                        .filter(p => p.id !== session?.user?.id)
                                        .map(p => p.name)
                                        .join(', ')}
                                    </p>
                                    <span className="ml-1 text-xs text-gray-500 truncate">
                                      ({conversation.participants
                                        .filter(p => p.id !== session?.user?.id)
                                        .map(p => p.role.toLowerCase())
                                        .join(', ')})
                                    </span>
                                  </div>
                                  {conversation.lastMessage && (
                                    <p className="text-sm text-gray-500 truncate break-words">
                                      {conversation.lastMessage.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {conversation.lastMessage && (
                                <p className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                  {new Date(conversation.updatedAt).toLocaleDateString()}
                                </p>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Message area */}
              <div className="flex-1 flex flex-col min-w-0">
                {selectedConversation ? (
                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Message header */}
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900 break-words">
                        {selectedConversation.participants
                          .filter(p => p.id !== session?.user?.id)
                          .map(p => p.name)
                          .join(', ') || 'Conversation'}
                      </h2>
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-w-0">
                      {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center min-w-0">
                          <div className="text-center">
                            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 break-words">
                              No messages yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 break-words">
                              Be the first to send a message!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              {message.senderId !== session?.user?.id && (
                                <div className="flex-shrink-0 mr-2 self-end mb-1">
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium overflow-hidden">
                                    {message.senderAvatar ? (
                                      <img 
                                        src={message.senderAvatar} 
                                        alt={message.senderName || 'User'} 
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span>{(message.senderName || 'User').charAt(0)}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.senderId === session?.user?.id ? 'bg-indigo-100 text-indigo-900' : 'bg-white text-gray-800 border border-gray-200'}`}
                              >
                                {message.senderId !== session?.user?.id && message.senderName && (
                                  <p className="text-xs font-medium text-gray-700 mb-1">
                                    {message.senderName}
                                    {message.senderRole && (
                                      <span className="text-xs text-gray-500 ml-1">({message.senderRole.toLowerCase()})</span>
                                    )}
                                  </p>
                                )}
                                <p className="text-sm break-words">{message.content}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {message.sentAt ? new Date(message.sentAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }) : 'Sending...'}
                                </p>
                              </div>
                              {message.senderId === session?.user?.id && (
                                <div className="flex-shrink-0 ml-2 self-end mb-1">
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium overflow-hidden">
                                    {session?.user?.image ? (
                                      <img 
                                        src={session.user.image} 
                                        alt={session.user.name || 'You'} 
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span>{(session?.user?.name || 'You').charAt(0)}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Message input */}
                    <div className="p-4 border-t border-gray-200">
                      <form onSubmit={handleSendMessage} className="flex items-center min-w-0">
                        <input
                          type="text"
                          className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 min-w-0"
                          placeholder="Type a message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          disabled={isSubmitting}
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting || !messageInput.trim()}
                          className={`px-4 py-2 rounded-r-md text-sm font-medium text-white ${
                            isSubmitting || !messageInput.trim()
                              ? 'bg-indigo-300 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          {isSubmitting ? 'Sending...' : 'Send'}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-w-0">
                    <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1 break-words">No conversation selected</h3>
                    <p className="text-sm text-gray-500 break-words">
                      Select a conversation or create a new one to start messaging
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
      
      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 min-w-0">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 lg:p-6">
              <div className="flex justify-between items-center mb-4 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 break-words">New Message</h3>
                <button
                  onClick={() => {
                    setShowNewConversationModal(false);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5 lg:h-6 lg:w-6" />
                </button>
              </div>
              
              <form onSubmit={handleStartConversation}>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm break-words">
                    {error}
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                    To:
                  </label>
                  <select
                    id="recipient"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    required
                    disabled={isLoadingRecipients}
                  >
                    <option value="">{isLoadingRecipients ? 'Loading recipients...' : 'Select a recipient'}</option>
                    {!isLoadingRecipients && recipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.name} ({recipient.role})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                    Message:
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewConversationModal(false);
                      setError(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 break-words"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 break-words"
                    disabled={isLoading || !selectedRecipient || !newMessage.trim()}
                  >
                    {isLoading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesClient;
