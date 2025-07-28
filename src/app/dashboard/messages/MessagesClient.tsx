'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageSquare, PlusCircle } from 'lucide-react';

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

export default function MessagesClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/conversations');
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }
        const data = await response.json();
        setConversations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversations();
  }, []);

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // In a real app, you would fetch messages for this conversation
    setMessages(conversation.lastMessage ? [conversation.lastMessage] : []);
  };

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;
    
    try {
      setIsSubmitting(true);
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageInput,
        senderId: session?.user?.id || '',
        createdAt: new Date().toISOString(),
      };
      
      // In a real app, you would send this to your API
      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
      
      // Update the last message in the conversation
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: newMessage }
            : conv
        )
      );
      
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      conversation.participants.some(p => 
        p.name.toLowerCase().includes(search) ||
        p.role.toLowerCase().includes(search)
      ) ||
      conversation.lastMessage?.content.toLowerCase().includes(search)
    );
  });

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
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
                    <div className="p-4 text-center text-gray-500">
                      {isLoading ? 'Loading conversations...' : 'No conversations found'}
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
  );
}
