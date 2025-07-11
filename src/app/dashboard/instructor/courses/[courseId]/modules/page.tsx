'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Loader2, ArrowLeft, GripVertical, Grip, BookOpen, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { PageLayout } from '../../_components/PageLayout';
import { ModuleCard } from '../_components/ModuleCard';
import { SortableModuleCard } from '../_components/SortableModuleCard';
import { ModuleForm, type ModuleFormValues } from '../_components/ModuleForm';
import type { Module, ModuleStatus, CreateModuleRequest, UpdateModuleRequest } from '@/types/module';
import { getModules, createModule, updateModule, deleteModule, reorderModules } from '@/lib/api/modules';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Use ModuleFormValues from ModuleForm component

// Type for module reordering
type ModuleOrderUpdate = {
  id: string;
  order: number;
};

export default function CourseModulesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | undefined>(undefined);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch modules
  const fetchModules = useCallback(async () => {
    if (!courseId) return;
    try {
      setIsLoading(true);
      const data = await getModules(courseId);
      setModules(data);
    } catch (err: any) {
      console.error('Error fetching modules:', err);
      toast.error('Failed to load modules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Handle module creation
  const handleCreateModule = async (data: CreateModuleRequest) => {
    if (!courseId) return;
    try {
      await createModule(courseId, data);
      toast.success('Module created successfully!');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create module';
      toast.error(errorMessage);
      throw err; // Re-throw to be caught by the form
    }
  };

  // Handle module update
  const handleUpdateModule = async (id: string, data: UpdateModuleRequest) => {
    if (!courseId) return;
    try {
      await updateModule(courseId, id, data);
      toast.success('Module updated successfully!');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update module';
      toast.error(errorMessage);
      throw err; // Re-throw to be caught by the form
    }
  };

  // Handle module deletion
  const handleDeleteModule = async (moduleId: string) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      if (!courseId) return;
      try {
        await deleteModule(courseId, moduleId);
        toast.success('Module deleted successfully!');
        fetchModules(); // Refresh list
      } catch (err: any) {
        console.error('Error deleting module:', err);
        toast.error('Failed to delete module. Please try again.');
      }
    }
  };

  // Handle drag end for reordering
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);
      
      const originalModules = [...modules];
      const newModules = arrayMove(modules, oldIndex, newIndex).map((m, index) => ({ ...m, order: index + 1 }));
      
      setModules(newModules);

      const orderUpdates = newModules.map(({ id, order }) => ({
        id,
        order,
      }));

      try {
        await reorderModules(courseId, orderUpdates);
        toast.success('Module order saved!');
        
        // Give the database time to update and then refresh the data
        setTimeout(() => {
          fetchModules();
        }, 500);
      } catch (err: any) {
        console.error('Failed to reorder modules:', err);
        toast.error('Failed to save new order. Reverting changes.');
        
        // Reset modules to previous order
        setModules(originalModules);
      }
    }
  };

  // Toggle reorder mode
  const toggleReorderMode = () => {
    setIsReordering(prev => !prev);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingModule(undefined);
    setIsFormOpen(false);
  };

  return (
    <PageLayout
      title="Course Modules"
      backHref={`/dashboard/instructor/courses/${courseId}`}
    >
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">
              Organize your course content into structured learning modules
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{modules.filter(m => m.isPublished).length} Published</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{modules.filter(m => !m.isPublished).length} Draft</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{modules.length} Total Modules</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              variant={isReordering ? 'default' : 'outline'} 
              onClick={toggleReorderMode}
              className="flex-1 sm:flex-none"
              disabled={modules.length === 0}
            >
              {isReordering ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Done Reordering
                </>
              ) : (
                <>
                  <Grip className="h-4 w-4 mr-2" />
                  Reorder
                </>
              )}
            </Button>
            <Button 
              onClick={() => {
                setEditingModule(undefined);
                setIsFormOpen(true);
              }}
              className="flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading modules...</p>
            </div>
          </div>
        ) : modules.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-6">
            <div className="max-w-md mx-auto">
              <div className="bg-muted/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No modules yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your course by creating your first module. Each module can contain lessons, assignments, and resources.
              </p>
              <Button 
                onClick={() => {
                  setEditingModule(undefined);
                  setIsFormOpen(true);
                }}
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Module
              </Button>
            </div>
          </div>
        ) : (
          /* Modules Grid */
          <div className="space-y-4">
            {isReordering ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-800">
                  <Grip className="h-4 w-4" />
                  <span className="font-medium">Reorder Mode Active</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Drag and drop modules to change their order
                </p>
              </div>
            ) : null}

            {isReordering ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={modules.map(m => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-4">
                    {modules
                      .sort((a, b) => a.order - b.order)
                      .map((module) => (
                        <SortableModuleCard
                          key={module.id}
                          module={module}
                          onEdit={handleEditModule}
                          onDelete={handleDeleteModule}
                        />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="grid gap-4">
                {modules
                  .sort((a, b) => a.order - b.order)
                  .map((module) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      onEdit={handleEditModule}
                      onDelete={handleDeleteModule}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ModuleForm
        module={editingModule}
        courseId={courseId}
        modules={modules}
        open={isFormOpen}
        onSuccess={() => {
          setEditingModule(undefined);
          fetchModules();
        }}
        onOpenChange={handleCloseForm}
        createModule={handleCreateModule}
        updateModule={handleUpdateModule}
      />
    </PageLayout>
  );
}
