"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ForumPost from '@/components/forums/ForumPost';
import { ArrowLeft, PlusCircle } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  likes: number;
  comments: any[];
}

interface Forum {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  isGlobal: boolean;
  postsCount: number;
}

export default function ForumPage({ 
  params 
}: { 
  params: { courseId: string; forumId: string } 
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { courseId, forumId } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  
  // Fetch forum data
  useEffect(() => {
    const fetchForum = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/courses/${courseId}/forums/${forumId}`);
        
        if (response.ok) {
          const data = await response.json();
          setForum(data.forum);
          setPosts(data.posts);
        } else {
          console.error('Failed to fetch forum');
        }
      } catch (error) {
        console.error('Error fetching forum:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchForum();
    }
  }, [courseId, forumId, session]);
  
  // Create new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    
    try {
      const response = await fetch(`/api/courses/${courseId}/forums/${forumId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
        }),
      });
      
      if (response.ok) {
        const newPost = await response.json();
        setPosts([newPost, ...posts]);
        setNewPostTitle('');
        setNewPostContent('');
        setIsCreateModalOpen(false);
      } else {
        console.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };
  
  // Like a post
  const handleLikePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/forums/${forumId}/posts/${postId}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId ? { ...post, likes: post.likes + 1 } : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  // Add a comment to a post
  const handleAddComment = async (postId: string, content: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/forums/${forumId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (response.ok) {
        const newComment = await response.json();
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, comments: [...post.comments, newComment] } 
            : post
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  // Delete a post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/courses/${courseId}/forums/${forumId}/posts/${postId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };
  
  // Edit a post
  const handleEditPost = async (postId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/forums/${forumId}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });
      
      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId ? { ...post, content: newContent, updatedAt: new Date().toISOString() } : post
        ));
      }
    } catch (error) {
      console.error('Error editing post:', error);
    }
  };
  
  if (status === 'loading' || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to forums link */}
        <Link 
          href={`/courses/${courseId}/forums`}
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Forums
        </Link>
        
        {/* Forum header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{forum?.title || 'Forum'}</h1>
            
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              New Post
            </button>
          </div>
          {forum?.description && (
            <p className="mt-2 text-sm text-gray-500">{forum.description}</p>
          )}
          <div className="mt-2 flex items-center">
            <span className="text-sm text-gray-500">
              {forum?.postsCount || 0} {forum?.postsCount === 1 ? 'post' : 'posts'}
            </span>
          </div>
        </div>
        
        {/* Posts list */}
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <h3 className="mt-2 text-lg font-medium text-gray-900">No posts yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Be the first to create a post in this forum!
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                Create a Post
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <ForumPost
                key={post.id}
                id={post.id}
                title={post.title}
                content={post.content}
                authorId={post.authorId}
                authorName={post.authorName}
                authorImage={post.authorImage}
                createdAt={post.createdAt}
                updatedAt={post.updatedAt}
                isPinned={post.isPinned}
                isLocked={post.isLocked}
                viewCount={post.viewCount}
                likes={post.likes}
                comments={post.comments}
                courseId={courseId}
                forumId={forumId}
                onLike={() => handleLikePost(post.id)}
                onReply={(content) => handleAddComment(post.id, content)}
                onDelete={() => handleDeletePost(post.id)}
                onEdit={(newContent) => handleEditPost(post.id, newContent)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Create Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsCreateModalOpen(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Create New Post
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Share your thoughts, questions, or insights with other students and instructors.
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleCreatePost} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="post-title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="post-title"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Give your post a clear, descriptive title"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="post-content" className="block text-sm font-medium text-gray-700">
                    Content *
                  </label>
                  <textarea
                    id="post-content"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Write your post content here..."
                    rows={6}
                    required
                  />
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  >
                    Create Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
