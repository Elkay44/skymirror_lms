"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ForumCard from '@/components/forums/ForumCard';
import { PlusCircle } from 'lucide-react';

interface Forum {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  isGlobal: boolean;
  postsCount: number;
  lastPostAt: string | null;
  lastPostAuthor: string | null;
}

export default function ForumsPage({ params }: { params: { courseId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { courseId } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [forums, setForums] = useState<Forum[]>([]);
  const [courseName, setCourseName] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumDescription, setNewForumDescription] = useState('');
  
  // Fetch forums data
  useEffect(() => {
    const fetchForums = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/courses/${courseId}/forums`);
        
        if (response.ok) {
          const data = await response.json();
          setForums(data.forums);
          setCourseName(data.courseName || 'Course');
        } else {
          console.error('Failed to fetch forums');
        }
      } catch (error) {
        console.error('Error fetching forums:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchForums();
    }
  }, [courseId, session]);
  
  // Create new forum
  const handleCreateForum = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newForumTitle.trim()) return;
    
    try {
      const response = await fetch(`/api/courses/${courseId}/forums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newForumTitle,
          description: newForumDescription,
        }),
      });
      
      if (response.ok) {
        const newForum = await response.json();
        setForums([...forums, newForum]);
        setNewForumTitle('');
        setNewForumDescription('');
        setIsCreateModalOpen(false);
      } else {
        console.error('Failed to create forum');
      }
    } catch (error) {
      console.error('Error creating forum:', error);
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{courseName} Forums</h1>
            <p className="mt-1 text-sm text-gray-500">
              Join the discussion with fellow students and instructors
            </p>
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
            New Discussion
          </button>
        </div>
        
        {forums.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <h3 className="mt-2 text-lg font-medium text-gray-900">No forums yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Be the first to start a discussion for this course!
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                Start a Discussion
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {forums.map((forum) => (
              <ForumCard
                key={forum.id}
                id={forum.id}
                title={forum.title}
                description={forum.description}
                courseId={courseId}
                isGlobal={forum.isGlobal}
                postsCount={forum.postsCount}
                lastPostAt={forum.lastPostAt}
                lastPostAuthor={forum.lastPostAuthor}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Create Forum Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsCreateModalOpen(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Create New Discussion Forum
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Start a new discussion forum for this course. Give it a clear title and description so students know what to expect.
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleCreateForum} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="forum-title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="forum-title"
                    value={newForumTitle}
                    onChange={(e) => setNewForumTitle(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., General Discussion, Help & Support, etc."
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="forum-description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="forum-description"
                    value={newForumDescription}
                    onChange={(e) => setNewForumDescription(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Briefly describe what this forum is about..."
                    rows={3}
                  />
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  >
                    Create Forum
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
