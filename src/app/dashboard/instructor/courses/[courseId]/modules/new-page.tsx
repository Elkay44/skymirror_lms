'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Loader2, BookOpen } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageLayout } from '../../_components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { getModules, createModule, updateModule, deleteModule, reorderModules } from '@/lib/api/modules';
import type { Module, ModuleStatus, CreateModuleRequest, UpdateModuleRequest } from '@/types/module';
import { ModuleForm } from '../_components/ModuleForm';
import { SortableModuleCard } from '../_components/SortableModuleCard';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

interface CourseModulesContentProps {}

const CourseModulesContent: React.FC<CourseModulesContentProps> = () => {
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  
  // Get courseId from params with proper type checking
  const courseId = useMemo(() => {
    const id = params?.courseId;
    console.log('[CourseModulesContent] Course ID from params:', id, 'Type:', typeof id);
    
    if (!id) {
      const err = new Error('No course ID provided in the URL');
      err.name = 'InvalidCourseIdError';
      console.error('[CourseModulesContent]', err.message);
      setError(err);
      return '';
    }
    
    // Ensure courseId is a string and not an array
    const courseIdStr = Array.isArray(id) ? id[0] : id;
    
    // Validate courseId is not empty
    if (!courseIdStr || typeof courseIdStr !== 'string' || courseIdStr.trim() === '') {
      const err = new Error('Invalid course ID format');
      err.name = 'InvalidCourseIdError';
      console.error('[CourseModulesContent] Empty or invalid course ID:', id);
      setError(err);
      return '';
    }
    
    return courseIdStr;
  }, [params]);
  
  // Log when courseId changes
  useEffect(() => {
    console.log('[CourseModulesContent] Course ID updated:', courseId);
  }, [courseId]);

  // Initialize sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch modules
  const fetchModules = useCallback(async () => {
    console.log('[CourseModulesContent] Fetching modules for course:', courseId);
    
    // Check if courseId is valid
    if (!courseId || typeof courseId !== 'string' || courseId.trim() === '') {
      const err = new Error('Invalid course ID');
      err.name = 'InvalidCourseIdError';
      console.error('[CourseModulesContent]', err.message);
      setError(err);
      toast.error('Invalid course ID. Please check the URL and try again.');
      return [];
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`[CourseModulesContent] Calling getModules with courseId: ${courseId} (type: ${typeof courseId})`);
      const data = await getModules(courseId);
      console.log('[CourseModulesContent] Modules data received:', data);
      
      if (!Array.isArray(data)) {
        const err = new Error('Invalid response format: expected array of modules');
        console.error('[CourseModulesContent]', err.message, 'Received:', data);
        toast.error('Failed to load modules: Invalid response from server');
        return [];
      }
      
      if (data.length === 0) {
        console.log('[CourseModulesContent] No modules found for this course');
        setModules([]);
        return [];
      }
      
      // Sort modules by order
      const sortedModules = [...data].sort((a, b) => (a.order || 0) - (b.order || 0));
      setModules(sortedModules);
      return sortedModules;
    } catch (err: unknown) {
      console.error('[CourseModulesContent] Error in fetchModules:', err);
      
      if (err instanceof Error) {
        if (err.name === 'CourseNotFoundError') {
          console.error(`[CourseModulesContent] Course not found with ID: ${courseId}`);
          // Re-throw to be caught by the error boundary
          const notFoundError = new Error('COURSE_NOT_FOUND');
          notFoundError.name = 'CourseNotFoundError';
          throw notFoundError;
        }
        
        // Set error state for other errors
        setError(err);
        toast.error(`Error: ${err.message}`);
      } else {
        // Handle non-Error objects
        const unknownError = new Error('An unknown error occurred');
        setError(unknownError);
        toast.error('An unexpected error occurred');
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);
  
  // Fetch modules on mount
  useEffect(() => {
    if (!courseId) {
      console.log('[CourseModulesContent] No courseId available, skipping fetch');
      return;
    }
    
    console.log('[CourseModulesContent] Initial fetch for course:', courseId);
    
    const loadModules = async () => {
      try {
        await fetchModules();
      } catch (error) {
        console.error('[CourseModulesContent] Error in loadModules:', error);
        
        if (error instanceof Error) {
          if (error.name === 'CourseNotFoundError') {
            toast.error('Course not found. Please check the URL and try again.');
            router.push('/dashboard/instructor/courses');
          } else if (error.name === 'InvalidCourseIdError') {
            toast.error('Invalid course ID. Please check the URL and try again.');
            router.push('/dashboard/instructor/courses');
          } else {
            toast.error(`Failed to load modules: ${error.message}`);
          }
        } else {
          toast.error('An unknown error occurred while loading modules');
        }
      }
    };
    
    loadModules();
  }, [courseId, fetchModules, router]);

  // Handle module creation
  const handleCreateModule = useCallback(async (data: CreateModuleRequest) => {
    if (!courseId) {
      toast.error(' course ID provided');
      return;
    }
    
    try {
      setIsLoading(true);
      await createModule(courseId, {
        ...data,
        description: data.description || '', // Ensure description is not undefined
        status: data.status || 'draft', // Default to draft if not provided
      });
      toast.success('Module created successfully');
      setIsFormOpen(false);
      await fetchModules();
    } catch (err) {
      const error = err as Error;
      console.error('Error creating module:', error);
      toast.error(error.message || 'Failed to create module');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, fetchModules]);

  // Handle module update
  const handleUpdateModule = useCallback(async (id: string, data: UpdateModuleRequest) => {
    if (!courseId) {
      toast.error('No course ID provided');
      return;
    }
    
    try {
      setIsLoading(true);
      await updateModule(courseId, id, {
        ...data,
        // Ensure required fields are present
        title: data.title || 'Untitled Module',
        description: data.description || '',
        status: data.status || 'draft',
      });
      toast.success('Module updated successfully');
      setEditingModule(undefined);
      await fetchModules();
    } catch (err) {
      const error = err as Error;
      console.error('Error updating module:', error);
      toast.error(error.message || 'Failed to update module');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, fetchModules]);

  // Handle module deletion
  const handleDeleteModule = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this module? This action cannot be undone.')) return;
    if (!courseId) {
      toast.error('No course ID provided');
      return;
    }
    
    try {
      setIsLoading(true);
      await deleteModule(courseId, id);
      toast.success('Module deleted successfully');
      await fetchModules();
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting module:', error);
      toast.error(error.message || 'Failed to delete module');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, fetchModules]);

  // Handle module reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    setModules((currentModules) => {
      const oldIndex = currentModules.findIndex((item) => item.id === active.id);
      const newIndex = currentModules.findIndex((item) => item.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return currentModules;
      
      const newItems = arrayMove(currentModules, oldIndex, newIndex);
      
      // Update order in the database
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order: index + 1,
      }));
      
      // Optimistically update the UI
      const reorderedModules = newItems.map((item, index) => ({
        ...item,
        order: index + 1,
      }));
      
      // Update the database in the background
      if (courseId) {
        reorderModules(courseId, updates).catch((err) => {
          console.error('Failed to update module order:', err);
          toast.error('Failed to save module order');
          // Revert on error
          fetchModules();
        });
      }
      
      return reorderedModules;
    });
  }, [courseId, fetchModules]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="sr-only">Loading modules...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error: {error.message}</p>
          <Button onClick={() => fetchModules()}>
            Retry
          </Button>
        </div>
      );
    }
    
    if (modules.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No modules</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new module.</p>
          <div className="mt-6">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Module
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={modules.map(module => module.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {modules.map((module) => (
              <SortableModuleCard
                key={module.id}
                module={module}
                onEdit={() => setEditingModule(module)}
                onDelete={handleDeleteModule}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  };
  return (
    <PageLayout
      title="Course Modules"
      description="Manage your course modules and their content"
      actions={
        <Button 
          onClick={() => setIsFormOpen(true)} 
          disabled={isLoading}
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Module
        </Button>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            {renderContent()}
          </CardContent>
        </Card>

        {/* Module Form Modal */}
        <ModuleForm
          module={editingModule}
          courseId={courseId || ''}
          modules={modules}
          open={isFormOpen || !!editingModule}
          onOpenChange={(open) => {
            if (!open) {
              setIsFormOpen(false);
              setEditingModule(undefined);
            } else {
              setIsFormOpen(true);
            }
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingModule(undefined);
            fetchModules();
          }}
          createModule={handleCreateModule}
          updateModule={handleUpdateModule}
        />
      </div>
    </PageLayout>
  );
}

interface CourseError extends Error {
  name: string;
  message: string;
  stack?: string;
}

export default function CourseModulesPage() {
  const router = useRouter();
  const [error, setError] = useState<CourseError | null>(null);
  const [courseId] = useState(() => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      return pathParts[pathParts.indexOf('courses') + 1];
    }
    return '';
  });
  
  const handleCourseNotFound = useCallback(() => {
    console.error('Course not found, redirecting to courses list');
    toast.error('The requested course was not found or you do not have permission to view it.');
    // Use replace instead of push to prevent going back to the not-found page
    router.replace('/dashboard/instructor/courses');
  }, [router]);

  // Handle errors from the content component
  const handleError = useCallback((error: unknown) => {
    console.error('Error in CourseModulesContent:', error);
    
    if (error instanceof Error) {
      setError(error as CourseError);
      
      if (error.name === 'CourseNotFoundError') {
        handleCourseNotFound();
      } else {
        toast.error('An error occurred while loading the course modules.');
      }
    } else {
      // Handle non-Error objects
      const unknownError = new Error('An unknown error occurred') as CourseError;
      setError(unknownError);
      toast.error('An unexpected error occurred.');
    }
  }, [handleCourseNotFound]);

  if (error) {
    if (error.name === 'CourseNotFoundError') {
      return (
        <PageLayout
          title="Course Not Found"
          description="The requested course could not be found"
        >
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Course Not Found</h2>
            <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => router.push('/dashboard/instructor/courses')}>
              Back to Courses
            </Button>
          </div>
        </PageLayout>
      );
    }
    
    // For other errors, show a generic error message
    return (
      <PageLayout
        title="Error Loading Course"
        description="An error occurred while loading the course"
      >
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">We couldn't load the course modules. Please try again later.</p>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button onClick={() => router.push('/dashboard/instructor/courses')}>
              Back to Courses
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Handle initial course not found case
  useEffect(() => {
    const courseError = error as CourseError | null;
    if (courseError?.name === 'CourseNotFoundError') {
      handleCourseNotFound();
    }
  }, [error, handleCourseNotFound]);

  return (
    <ErrorBoundary onError={handleError}>
      <CourseModulesContent />
    </ErrorBoundary>
  );
}
