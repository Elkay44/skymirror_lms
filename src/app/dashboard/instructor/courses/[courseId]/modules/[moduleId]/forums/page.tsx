'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, MessageSquare, AlertTriangle } from 'lucide-react';
import { CreateForumModal } from './CreateForumModal';
import { formatDistanceToNow } from 'date-fns';

interface Forum {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    posts: number;
  }
}

interface ModuleForumsPageProps {
  params: Promise<{ courseId: string; moduleId: string }>;
}

export default function ModuleForumsPage({ params: paramsPromise }: ModuleForumsPageProps) {
  const [params, setParams] = useState<{ courseId: string; moduleId: string } | null>(null);
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  // Load params when component mounts
  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await paramsPromise;
        setParams(resolvedParams);
      } catch (err) {
        console.error('Error loading params:', err);
        setError('Failed to load module data');
        setLoading(false);
      }
    };

    loadParams();
  }, [paramsPromise]);

  // Fetch forums when params are available
  useEffect(() => {
    if (!params) return;
    
    const { courseId, moduleId } = params;
    
    const fetchForums = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/forums`);
        
        if (!response.ok) {
          throw new Error('Failed to load forums');
        }
        
        const data = await response.json();
        setForums(data);
      } catch (err) {
        console.error('Error loading forums:', err);
        setError(err instanceof Error ? err.message : 'Failed to load forums');
      } finally {
        setLoading(false);
      }
    };
    
    fetchForums();
  }, [params]);

  const handleForumCreated = (newForum: Forum) => {
    setForums(prev => [newForum, ...prev]);
    setIsCreateModalOpen(false);
  };

  const navigateToForum = (forumId: string) => {
    if (!params) return;
    router.push(`/dashboard/instructor/courses/${params.courseId}/modules/${params.moduleId}/forums/${forumId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading forums</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Module Forums</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Forum
        </Button>
      </div>

      {forums.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No forums</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new forum.</p>
              <div className="mt-6">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Forum
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {forums.map((forum) => (
            <Card 
              key={forum.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigateToForum(forum.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{forum.title}</CardTitle>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    forum.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {forum.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {forum.description && (
                  <CardDescription className="line-clamp-2">
                    {forum.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-gray-500">
                  <MessageSquare className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  <span>{forum._count.posts} posts</span>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-gray-500">
                Created {formatDistanceToNow(new Date(forum.createdAt), { addSuffix: true })}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CreateForumModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        courseId={params?.courseId || ''}
        moduleId={params?.moduleId || ''}
        onSuccess={handleForumCreated}
      />
    </div>
  );
}
