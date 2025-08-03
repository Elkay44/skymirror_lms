"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { ThumbsUp, Reply, MoreVertical, Edit, Trash, Flag } from 'lucide-react';

interface ForumCommentProps {
  content: string;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  createdAt: string;
  likes: number;
  depth?: number;
  onLike?: () => void;
  onReply?: (commentContent: string) => void;
  onDelete?: () => void;
  onReport?: () => void;
  onEdit?: (newContent: string) => void;
}

export function ForumComment({
  content,
  authorId,
  authorName,
  authorImage,
  createdAt,
  likes,
  depth = 0,
  onLike,
  onReply,
  onDelete,
  onReport,
  onEdit,
}: ForumCommentProps) {
  const { data: session } = useSession();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const isAuthor = session?.user?.email && authorId === session.user.id;
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  const handleSubmitReply = () => {
    if (replyContent.trim() && onReply) {
      onReply(replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
  };
  
  const handleSubmitEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent);
      setIsEditing(false);
    }
  };
  
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  
  // Limit nesting depth to 3 levels
  const maxDepth = 3;
  const currentDepth = Math.min(depth, maxDepth);
  const indentClass = currentDepth > 0 ? `ml-${currentDepth * 4}` : '';
  
  return (
    <div className={`p-4 ${indentClass}`}>
      <div className="flex items-start space-x-3">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          {authorImage ? (
            <Image 
              src={authorImage} 
              alt={authorName} 
              width={32} 
              height={32} 
              className="rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-medium">
                {authorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{authorName}</h4>
              <p className="text-xs text-gray-500">{formattedDate}</p>
            </div>
            
            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    {isAuthor && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowDropdown(false);
                        }}
                        className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        Edit Comment
                      </button>
                    )}
                    {isAuthor && (
                      <button
                        onClick={() => {
                          if (onDelete) onDelete();
                          setShowDropdown(false);
                        }}
                        className="flex items-center px-4 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left"
                      >
                        <Trash className="h-3 w-3 mr-2" />
                        Delete Comment
                      </button>
                    )}
                    {!isAuthor && (
                      <button
                        onClick={() => {
                          if (onReport) onReport();
                          setShowDropdown(false);
                        }}
                        className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Flag className="h-3 w-3 mr-2" />
                        Report Comment
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
              <div className="flex justify-end mt-2 space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEdit}
                  className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm text-gray-700">
              {content}
            </div>
          )}
          
          {/* Comment Actions */}
          <div className="mt-2 flex items-center space-x-4">
            <button 
              onClick={onLike}
              className="flex items-center text-xs text-gray-500 hover:text-indigo-600"
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              {likes} {likes === 1 ? 'Like' : 'Likes'}
            </button>
            
            {currentDepth < maxDepth && (
              <button 
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center text-xs text-gray-500 hover:text-indigo-600"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </button>
            )}
          </div>
          
          {/* Reply Form */}
          {isReplying && session?.user && (
            <div className="mt-3 pl-6">
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  {session.user.image ? (
                    <Image 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      width={24} 
                      height={24} 
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-medium text-xs">
                        {(session.user.name || session.user.email)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => setIsReplying(false)}
                      className="px-3 py-1 mr-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim()}
                      className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
