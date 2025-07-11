import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Video, Image, FileText, MoreHorizontal } from 'lucide-react';

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
  size: string;
  thumbnailUrl?: string;
}

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, attachments?: File[]) => void;
  recipientName: string;
  recipientRole: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR';
  isGroupChat?: boolean;
  courseName?: string;
  isLoading: boolean;
}

export default function MessageThread({
  messages,
  currentUserId,
  onSendMessage,
  recipientName,
  recipientRole,
  isGroupChat = false,
  courseName
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim() === '' && attachments.length === 0) return;
    
    onSendMessage(newMessage, attachments);
    setNewMessage('');
    setAttachments([]);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
      e.target.value = ''; // Reset input value
    }
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  // Format message timestamp
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  
  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = message.timestamp.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      
      groups[date].push(message);
    });
    
    return groups;
  };
  
  const groupedMessages = groupMessagesByDate();
  
  // Get role-based styling
  const getRoleStyles = (role: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR') => {
    switch (role) {
      case 'STUDENT':
        return {
          color: 'text-blue-700',
          bgLight: 'bg-blue-50',
          bgDark: 'bg-blue-500'
        };
      case 'INSTRUCTOR':
        return {
          color: 'text-purple-700',
          bgLight: 'bg-purple-50',
          bgDark: 'bg-purple-500'
        };
      case 'MENTOR':
        return {
          color: 'text-teal-700',
          bgLight: 'bg-teal-50',
          bgDark: 'bg-teal-500'
        };
    }
  };
  
  // Get attachment icon
  const getAttachmentIcon = (type: 'image' | 'document' | 'video') => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
    }
  };
  
  // Get file icon for attachment preview
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-5 w-5 text-red-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Format file size
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Thread header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            {isGroupChat ? courseName : recipientName}
          </h2>
          <p className="text-sm text-gray-500">
            {isGroupChat ? 'Course group chat' : recipientRole.charAt(0) + recipientRole.slice(1).toLowerCase()}
          </p>
        </div>
        <div>
          <button className="p-2 text-gray-400 hover:text-gray-500">
            <Video className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-500">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {Object.keys(groupedMessages).map(date => (
          <div key={date} className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                {date}
              </div>
            </div>
            
            {groupedMessages[date].map(message => {
              const isCurrentUser = message.senderId === currentUserId;
              const roleStyles = getRoleStyles(message.senderRole);
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex max-w-md">
                    {!isCurrentUser && (
                      <div className="flex-shrink-0 mr-3">
                        {message.senderAvatar ? (
                          <img 
                            className="h-8 w-8 rounded-full" 
                            src={message.senderAvatar} 
                            alt={message.senderName} 
                          />
                        ) : (
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${roleStyles.bgDark}`}>
                            <span className="text-xs font-medium text-white">
                              {message.senderName.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div>
                      {!isCurrentUser && (
                        <div className="flex items-center">
                          <p className={`text-xs font-medium ${roleStyles.color}`}>
                            {message.senderName}
                          </p>
                          <span className="ml-1 text-xs text-gray-400">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                      
                      <div 
                        className={`mt-1 px-4 py-2 rounded-lg ${isCurrentUser ? 'bg-blue-500 text-white' : roleStyles.bgLight + ' text-gray-900'}`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map(attachment => (
                              <div key={attachment.id} className="flex items-center rounded-md overflow-hidden border border-gray-200 bg-white">
                                {attachment.type === 'image' && attachment.thumbnailUrl ? (
                                  <div className="h-12 w-12 bg-gray-100 flex-shrink-0">
                                    <img 
                                      src={attachment.thumbnailUrl} 
                                      alt={attachment.name} 
                                      className="h-full w-full object-cover" 
                                    />
                                  </div>
                                ) : (
                                  <div className="h-12 w-12 bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    {getAttachmentIcon(attachment.type)}
                                  </div>
                                )}
                                
                                <div className="px-3 py-2 flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">{attachment.name}</p>
                                  <p className="text-xs text-gray-500">{attachment.size}</p>
                                </div>
                                
                                <a 
                                  href={attachment.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="pr-3 text-blue-500 hover:text-blue-600 text-xs"
                                >
                                  View
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {isCurrentUser && (
                        <div className="flex justify-end mt-1">
                          <span className="text-xs text-gray-400">
                            {formatMessageTime(message.timestamp)}
                            {message.isRead && (
                              <span className="ml-1">• Read</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center bg-gray-100 rounded-md px-3 py-2 max-w-xs">
                {getFileIcon(file)}
                <div className="ml-2 flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button 
                  className="ml-2 text-gray-400 hover:text-gray-500"
                  onClick={() => removeAttachment(index)}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Message input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-end">
          <div className="flex-1 mr-3">
            <textarea
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Type your message..."
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          
          <div className="flex space-x-2">
            <div>
              <input
                id="file-upload"
                type="file"
                multiple
                className="sr-only"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer p-2 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <Paperclip className="h-5 w-5 text-gray-500" />
              </label>
            </div>
            
            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={newMessage.trim() === '' && attachments.length === 0}
            >
              <Send className="h-4 w-4 mr-1" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
