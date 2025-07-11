'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, MessageSquare, Users, AlertTriangle } from 'lucide-react';
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

export default function ModuleForumsPage({ 
  params 
}: { 
  params: { courseId: string; moduleId: string } 
}) {
  const router = useRouter();
  const { courseId, moduleId } = params;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [forums, setForums] = useState<Forum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  
  const fetchForums = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First fetch the module to get its title
      const moduleResponse = await fetch(`/api/courses/${courseId}/modules/${moduleId}`);
      if (!moduleResponse.ok) {
        throw new Error('Failed to load module information');
      }
      const moduleData = await moduleResponse.json();
      setModuleTitle(moduleData.module.title);
      
      // Then fetch the forums
      const forumsResponse = await fetch(`/api/courses/${courseId}/modules/${moduleId}/forums`);
      if (!forumsResponse.ok) {
        throw new Error('Failed to load forums');
      }
      
      const data = await forumsResponse.json();
      setForums(data.forums);
    } catch (err) {
      console.error('Error fetching module forums:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading forums');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchForums();
  }, [courseId, moduleId]);
  
  return (
    <div className="container py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Module Forums</h1>
          <p className="text-muted-foreground mt-2">
            Manage discussion forums for module: {moduleTitle || 'Loading...'}
          </p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Forum
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
          <h3 className="text-lg font-medium">Something went wrong</h3>
          <p className="text-muted-foreground mt-2 max-w-md">{error}</p>
          <Button variant="outline" onClick={fetchForums} className="mt-4">
            Try Again
          </Button>
        </div>
      ) : forums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-muted/20">
          <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No forums yet</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            Create a forum to allow discussions specific to this module.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Create Forum
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forums.map((forum) => (
            <Card key={forum.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {forum.title}
                  {!forum.isActive && (
                    <span className="text-xs font-normal py-1 px-2 bg-amber-100 text-amber-800 rounded-full">
                      Inactive
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {forum.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {forum._count.posts} posts
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-muted/30 py-3 text-xs text-muted-foreground border-t">
                <span>Created {formatDistanceToNow(new Date(forum.createdAt), { addSuffix: true })}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forums/${forum.id}`)}
                >
                  View Forum
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <CreateForumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={courseId}
        moduleId={moduleId}
      />
    </div>
  );
}
