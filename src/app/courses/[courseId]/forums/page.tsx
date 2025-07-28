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

export default function ForumsPage({ 
  params: paramsPromise 
}: { 
  params: Promise<{ courseId: string }>;
}) {
  const [params, setParams] = useState<{ courseId: string } | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [forums, setForums] = useState<Forum[]>([]);
  const [courseName, setCourseName] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumDescription, setNewForumDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load params and data
  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await paramsPromise;
        setParams(resolvedParams);
        
        // Fetch course and forums data
        const [courseRes, forumsRes] = await Promise.all([
          fetch(`/api/courses/${resolvedParams.courseId}`),
          fetch(`/api/courses/${resolvedParams.courseId}/forums`)
        ]);
        
        if (!courseRes.ok || !forumsRes.ok) throw new Error('Failed to load data');
        
        const [courseData, forumsData] = await Promise.all([
          courseRes.json(),
          forumsRes.json()
        ]);
        
        setCourseName(courseData.title);
        setForums(forumsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load forums');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [paramsPromise]);

  if (isLoading) {
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
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Forums: {courseName}</h1>
          {session?.user && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              New Forum
            </button>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {forums.length === 0 ? (
              <li className="px-4 py-6 text-center text-gray-500">
                No forums available yet.
              </li>
            ) : (
              forums.map((forum) => (
                <li key={forum.id}>
                  <ForumCard 
                    id={forum.id}
                    title={forum.title}
                    description={forum.description}
                    courseId={forum.courseId}
                    isGlobal={forum.isGlobal}
                    postsCount={forum.postsCount}
                    lastPostAt={forum.lastPostAt}
                    lastPostAuthor={forum.lastPostAuthor}
                    className="hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/courses/${params?.courseId}/forums/${forum.id}`)}
                  />
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
