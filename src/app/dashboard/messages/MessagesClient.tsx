'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageSquare, PlusCircle, X } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
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

  // Fetch recipients (in a real app, this would come from an API)
  useEffect(() => {
    // Mock recipients
    setRecipients([
      { id: 'user2', name: 'Sarah Johnson', role: 'MENTOR', avatarUrl: '' },
      { id: 'user3', name: 'Michael Lee', role: 'INSTRUCTOR', avatarUrl: '' },
      { id: 'user4', name: 'Emma Wilson', role: 'STUDENT', avatarUrl: '' },
    ]);
  }, []);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Add a delay to show loading state (optional, can be removed)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await fetch('/api/conversations');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // The API now returns the conversations array directly
        if (Array.isArray(data)) {
          setConversations(data);
          return;
        }
        
        // Fallback for unexpected format
        console.warn('Unexpected response format from /api/conversations:', data);
        setError('Unexpected response format from server');
        setConversations([]);
        
        // Fallback for any other case
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
      setIsLoading(true);
      setSelectedConversation(conversation);
      
      // Fetch messages for the selected conversation
      const response = await fetch(`/api/conversations/${conversation.id}/messages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const messagesData = await response.json();
      setMessages(Array.isArray(messagesData) ? messagesData : []);
      
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
      setMessages(conversation.lastMessage ? [conversation.lastMessage] : []);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle starting a new conversation
  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRecipient || !newMessage.trim()) {
      setError('Please select a recipient and enter a message');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: selectedRecipient,
          message: {
            content: newMessage,
            senderId: session?.user?.id,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const newConversation = await response.json();
      
      // Add the new conversation to the list
      setConversations(prev => [newConversation, ...prev]);
      
      // Select the new conversation
      setSelectedConversation(newConversation);
      
      // Reset form
      setNewMessage('');
      setSelectedRecipient('');
      setShowNewConversationModal(false);
      
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError('Failed to start conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation || !session?.user?.id) return;
    
    try {
      setIsSubmitting(true);
      
      // Create message object
      const newMessage: Message = {
        id: 'temp-' + Date.now(), // Temporary ID that will be replaced by server
        content: messageInput,
        senderId: session.user.id,
        createdAt: new Date().toISOString(),
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
        },
        body: JSON.stringify({
          content: messageInput,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Update with server response if needed
      const sentMessage = await response.json();
      
      // Replace the temporary message with the one from the server
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? sentMessage : msg
        )
      );
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      
      // Revert optimistic update on error
      setMessages(messages);
      
      // Re-fetch conversations to ensure consistency
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setConversations(data);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 w-full max-w-2xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-600 focus:outline-none focus:underline transition duration-150 ease-in-out"
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
    router.push('/auth/signin');
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">Loading your messages...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 w-full max-w-2xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-600 focus:outline-none focus:underline transition duration-150 ease-in-out"
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
      <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              New Message
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex h-[calc(100vh-200px)]">
              {/* Sidebar */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Search conversations"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                        <MessageSquare className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No conversations yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
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
                            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
                        const participant = conversation.participants[0]; // Simplified for demo
                        const isActive = selectedConversation?.id === conversation.id;
                        
                        return (
                          <li key={conversation.id}>
                            <button
                              onClick={() => handleSelectConversation(conversation)}
                              className={`w-full text-left p-4 hover:bg-gray-50 focus:outline-none ${
                                isActive ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  {participant?.avatarUrl ? (
                                    <img
                                      className="h-10 w-10 rounded-full"
                                      src={participant.avatarUrl}
                                      alt={participant.name}
                                    />
                                  ) : (
                                    <span className="text-gray-500">
                                      {participant?.name?.charAt(0) || '?'}
                                    </span>
                                  )}
                                </div>
                                <div className="ml-3 min-w-0 flex-1">
                                  <div className="flex justify-between">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {participant?.name || 'Unknown User'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(conversation.updatedAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                  <p className="text-sm text-gray-500 truncate">
                                    {conversation.lastMessage?.content || 'No messages yet'}
                                  </p>
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Message area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <div className="flex-1 flex flex-col">
                    {/* Message header */}
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">
                        {selectedConversation.participants[0]?.name || 'Conversation'}
                      </h2>
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                      {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                              No messages yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Be the first to send a message!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.senderId === session?.user?.id
                                  ? 'justify-end'
                                  : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.senderId === session?.user?.id
                                    ? 'bg-indigo-100 text-indigo-900'
                                    : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Message input */}
                    <div className="p-4 border-t border-gray-200">
                      <form onSubmit={handleSendMessage} className="flex items-center">
                        <input
                          type="text"
                          className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No conversation selected</h3>
                    <p className="text-sm text-gray-500">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">New Message</h3>
                <button
                  onClick={() => {
                    setShowNewConversationModal(false);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleStartConversation}>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                    To:
                  </label>
                  <select
                    id="recipient"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    required
                  >
                    <option value="">Select a recipient</option>
                    {recipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.name} ({recipient.role})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
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
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewConversationModal(false);
                      setError(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
