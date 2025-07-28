'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Loader2, BookOpen } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { PageLayout } from '../../_components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getModules } from '@/lib/api/modules';
import { Module } from '@/types/module';

function CourseModulesContent() {
  const router = useRouter();
  const { courseId } = useParams<{ courseId: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch modules
  const fetchModules = useCallback(async () => {
    if (!courseId) return;
    
    try {
      setIsLoading(true);
      const data = await getModules(courseId);
      setModules(data);
    } catch (error: any) {
      if (error.name === 'CourseNotFoundError') {
        throw error; // Let the error boundary handle this
      }
      console.error('Error fetching modules:', error);
      toast.error(error.message || 'Failed to load modules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return (
    <PageLayout
      title="Course Modules"
      description="Manage your course modules and content"
      actions={[
        <Button key="add-module" onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Module
        </Button>
      ]}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {modules.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No modules yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first module.</p>
                <div className="mt-6">
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Module
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {modules.map((module) => (
                <Card key={module.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      {module.description && (
                        <CardDescription>{module.description}</CardDescription>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}

export default function CourseModulesPage() {
  const router = useRouter();
  
  const handleCourseNotFound = useCallback(() => {
    toast.error('Course not found. It may have been deleted or you may not have access.');
    router.push('/dashboard/instructor/courses');
  }, [router]);

  return (
    <ErrorBoundary 
      onError={(error: Error) => {
        if (error.name === 'CourseNotFoundError') {
          handleCourseNotFound();
        }
      }}
    >
      <CourseModulesContent />
    </ErrorBoundary>
  );
}
