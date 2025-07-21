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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ForumPageProps {
  params: {
    courseId: string;
    forumId: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function ForumPage({ 
  params: paramsPromise 
}: { 
  params: Promise<{ courseId: string; forumId: string }>;
}) {
  const [params, setParams] = useState<{ courseId: string; forumId: string } | null>(null);
  const [forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    isPinned: false,
    isLocked: false
  });

  const { data: session, status } = useSession();
  const router = useRouter();

  // Load params when component mounts
  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await paramsPromise;
        setParams(resolvedParams);
      } catch (err) {
        console.error('Error loading params:', err);
        setError('Failed to load forum data');
        setIsLoading(false);
      }
    };

    loadParams();
  }, [paramsPromise]);

  // Load forum and posts when params are available
  useEffect(() => {
    if (!params) return;

    const { courseId, forumId } = params;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch forum details
        const forumRes = await fetch(`/api/courses/${courseId}/forums/${forumId}`);
        if (!forumRes.ok) throw new Error('Failed to fetch forum');
        const forumData = await forumRes.json();
        setForum(forumData);
        
        // Fetch forum posts
        const postsRes = await fetch(`/api/courses/${courseId}/forums/${forumId}/posts`);
        if (!postsRes.ok) throw new Error('Failed to fetch posts');
        const postsData = await postsRes.json();
        setPosts(postsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load forum data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!params) return;
    
    try {
      const { courseId, forumId } = params;
      const res = await fetch(`/api/courses/${courseId}/forums/${forumId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPost),
      });
      
      if (!res.ok) throw new Error('Failed to create post');
      
      // Refresh the posts
      const postsRes = await fetch(`/api/courses/${courseId}/forums/${forumId}/posts`);
      const postsData = await postsRes.json();
      setPosts(postsData);
      
      // Reset form
      setNewPost({
        title: '',
        content: '',
        isPinned: false,
        isLocked: false
      });
      
      setIsCreatingPost(false);
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
      </DashboardLayout>
    );
  }

  if (!forum) {
    return (
      <DashboardLayout>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Forum not found</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href={`/courses/${params?.courseId}/forums`}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Forums
              </Link>
              <h3 className="text-lg leading-6 font-medium text-gray-900">{forum.title}</h3>
              {forum.description && (
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {forum.description}
                </p>
              )}
            </div>
            {session?.user && (
              <button
                type="button"
                onClick={() => setIsCreatingPost(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                New Post
              </button>
            )}
          </div>
        </div>

        {isCreatingPost && (
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Create New Post</h4>
            <form onSubmit={handleCreatePost}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter post title"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  id="content"
                  rows={4}
                  required
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Write your post content here..."
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      id="isPinned"
                      type="checkbox"
                      checked={newPost.isPinned}
                      onChange={(e) => setNewPost({...newPost, isPinned: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPinned" className="ml-2 block text-sm text-gray-700">
                      Pin post
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="isLocked"
                      type="checkbox"
                      checked={newPost.isLocked}
                      onChange={(e) => setNewPost({...newPost, isLocked: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isLocked" className="ml-2 block text-sm text-gray-700">
                      Lock post
                    </label>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingPost(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Post
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {posts.length === 0 ? (
              <li className="px-4 py-6 text-center text-gray-500">
                No posts yet. Be the first to create one!
              </li>
            ) : (
              posts.map((post) => (
                <li key={post.id}>
                  <ForumPost post={post} />
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
