"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageSquare, ThumbsUp, Flag, MoreVertical, Clock, Edit, Trash } from 'lucide-react';
import { ForumComment } from './ForumComment';

interface ForumPostProps {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  viewCount: number;
  likes: number;
  comments: any[];
  courseId: string;
  forumId: string;
  onLike?: () => void;
  onReply?: (commentContent: string) => void;
  onDelete?: () => void;
  onReport?: () => void;
  onEdit?: (newContent: string) => void;
}

export default function ForumPost({
  id,
  title,
  content,
  authorId,
  authorName,
  authorImage,
  createdAt,
  updatedAt,
  isPinned = false,
  isLocked = false,
  viewCount,
  likes,
  comments = [],
  courseId,
  forumId,
  onLike,
  onReply,
  onDelete,
  onReport,
  onEdit,
}: ForumPostProps) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
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
  
  const formattedTime = new Date(createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const handleSubmitReply = () => {
    if (replyContent.trim() && onReply) {
      onReply(replyContent);
      setReplyContent('');
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
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
      {/* Post Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {authorImage ? (
                <Image 
                  src={authorImage} 
                  alt={authorName} 
                  width={40} 
                  height={40} 
                  className="rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-medium">
                    {authorName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <span>{authorName}</span>
                <span className="mx-1">•</span>
                <span>{formattedDate} at {formattedTime}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isPinned && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pinned
              </span>
            )}
            {isLocked && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Locked
              </span>
            )}
            
            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    {isAuthor && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowDropdown(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Post
                      </button>
                    )}
                    {isAuthor && (
                      <button
                        onClick={() => {
                          if (onDelete) onDelete();
                          setShowDropdown(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Post
                      </button>
                    )}
                    {!isAuthor && (
                      <button
                        onClick={() => {
                          if (onReport) onReport();
                          setShowDropdown(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Report Post
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Post Content */}
      <div className="px-6 py-4">
        {isEditing ? (
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              rows={6}
            />
            <div className="flex justify-end mt-3 space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
      
      {/* Post Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <button 
            onClick={onLike}
            className="flex items-center text-sm text-gray-500 hover:text-indigo-600"
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            {likes} {likes === 1 ? 'Like' : 'Likes'}
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center text-sm text-gray-500 hover:text-indigo-600"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </button>
          
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {viewCount} {viewCount === 1 ? 'View' : 'Views'}
          </div>
        </div>
        
        <Link
          href={`/courses/${courseId}/forums/${forumId}/posts/${id}`}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          View Full Post
        </Link>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200">
          {/* Existing Comments */}
          <div className="divide-y divide-gray-200">
            {comments.map((comment) => (
              <ForumComment key={comment.id} {...comment} />
            ))}
          </div>
          
          {/* Comment Form */}
          {!isLocked && session?.user && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  {session.user.image ? (
                    <Image 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      width={32} 
                      height={32} 
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">
                        {(session.user.name || session.user.email)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim()}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {isLocked && (
            <div className="p-4 bg-yellow-50 text-center">
              <p className="text-sm text-yellow-800">
                This post is locked. New comments are not allowed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
