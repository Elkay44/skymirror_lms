'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tooltip } from '@/components/ui/tooltip';
import { 
  Plus, ArrowLeft, Loader2, LayoutGrid, MessageCircle, 
  FileText, Settings, Users, BookOpen, GraduationCap, CheckCircle2, 
  BarChart4, Trash2, Copy, Eye, GripVertical, Video, FileCheck2, Code,
  Clock, Calendar, ListChecks
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { ModulePages } from './_components/ModulePages';
import { ContentBlockEditor } from './_components/ContentBlockEditor';
import { BlockItem } from './_components/BlockItem';
import { PageLayout } from '../../_components/PageLayout';
import { 
  Module, 
  ModulePage, 
  ContentBlock, 
  ContentBlockType,
  Project,
  GetModulePagesResponse
} from '@/types/module';
import { 
  getModule
} from '@/lib/api/modules';
import {
  getModulePages
} from '@/lib/api/module-pages';
import { 
  createContentBlock, 
  updateContentBlock, 
  deleteContentBlock,
  getModulePage
} from '@/lib/api/module-pages';
import { getModuleProjects } from '@/lib/api/projects';

// DND Kit imports for drag and drop functionality
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from "./_components/SortableItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ModuleDiscussions } from "./_components/ModuleDiscussions";
import { Badge } from '@/components/ui/badge';

export default function ModuleDetailsPage() {
  const params = useParams<{ courseId: string; moduleId: string }>();
  const router = useRouter();
  const { courseId, moduleId } = params;
  
  const [module, setModule] = useState<Module | null>(null);
  const [pages, setPages] = useState<ModulePage[]>([]);
  const [activePage, setActivePage] = useState<ModulePage | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlockEditorOpen, setIsBlockEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | undefined>(undefined);
  const [selectedBlockType, setSelectedBlockType] = useState<ContentBlockType>('text');
  const [activeTab, setActiveTab] = useState('content');
  const [isSorting, setIsSorting] = useState(false);

  // Initialize sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch module details
      const [moduleData, pagesResponse, projectsData] = await Promise.all([
        getModule(courseId, moduleId),
        getModulePages(courseId, moduleId),
        getModuleProjects(courseId, moduleId)
      ]);
      
      setModule(moduleData);
      
      // Extract pages from the response
      const pages = pagesResponse.data;
      setPages(pages);
      
      // Set projects
      setProjects(projectsData);
      
      // Set first page as active if available
      if (pages.length > 0) {
        setActivePage(pages[0]);
        
        // Fetch content blocks for the first page
        const pageData = await getModulePage(courseId, moduleId, pages[0].id);
        const contentBlocks = pageData.contentBlocks || [];
        setBlocks(contentBlocks);
      }
    } catch (error) {
      console.error('Error fetching module data:', error);
      toast.error('Failed to load module data');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, moduleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectPage = async (page: ModulePage) => {
    try {
      setActivePage(page);
      setIsLoading(true);
      
      // Fetch module page with blocks
      const pageData = await getModulePage(courseId, moduleId, page.id);
      const blocksData = { data: pageData.contentBlocks || [] };
      setBlocks(blocksData.data);
    } catch (error) {
      console.error('Error fetching page blocks:', error);
      toast.error('Failed to load page content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBlock = (type: ContentBlockType = 'text') => {
    setSelectedBlockType(type);
    setEditingBlock(undefined);
    setIsBlockEditorOpen(true);
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !activePage) {
      return;
    }

    const oldIndex = blocks.findIndex(block => block.id === active.id);
    const newIndex = blocks.findIndex(block => block.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      try {
        // Update the order in state first for immediate UI update
        const newBlocks = arrayMove(blocks, oldIndex, newIndex);
        
        // Update the order property of each block
        const updatedBlocks = newBlocks.map((block, index) => ({
          ...block,
          order: index
        }));
        
        // Update local state immediately for responsive UI
        setBlocks(updatedBlocks);
        setIsSorting(true);
        
        // Prepare data for the API call
        const blockOrderData = updatedBlocks.map(block => ({
          id: block.id,
          order: block.order
        }));
        
        try {
          // Call the API to update block orders
          const response = await fetch(
            `/api/courses/${courseId}/modules/${moduleId}/pages/${activePage.id}/blocks/reorder`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ blocks: blockOrderData }),
            }
          );
          
          const data = await response.json();
          
          if (!response.ok) {
            console.error('API error response:', data);
            throw new Error(data.error || 'Failed to update block order');
          }
          
          toast.success('Block order updated');
        } catch (apiError) {
          console.error('Error updating block order:', apiError);
          toast.error('Failed to save changes to server');
          // Don't revert UI state to provide better user experience
        }
      } catch (error) {
        console.error('Error in drag end handling:', error);
        toast.error('Something went wrong while reordering blocks');
      } finally {
        setIsSorting(false);
      }
    }
  };

  const handleEditBlock = (block: ContentBlock) => {
    setEditingBlock(block);
    setIsBlockEditorOpen(true);
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!activePage) return;
    
    try {
      await deleteContentBlock(courseId, moduleId, activePage.id, blockId);
      setBlocks(blocks.filter(block => block.id !== blockId));
      toast.success('Content block deleted');
    } catch (error) {
      console.error('Error deleting content block:', error);
      toast.error('Failed to delete content block');
    }
  };

  const handleSaveBlock = async (block: ContentBlock) => {
    if (!activePage) return;
    
    try {
      // If updating an existing block
      if (editingBlock) {
        const updatedBlock = await updateContentBlock(
          courseId,
          moduleId,
          activePage.id,
          block.id,
          { id: block.id, data: block }
        );
        setBlocks(blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b));
        toast.success('Content block updated successfully');
      } 
      // If adding a new block
      else {
        const newBlock = await createContentBlock(
          courseId,
          moduleId,
          activePage.id,
          block
        );
        setBlocks([...blocks, newBlock]);
        toast.success('Content block created successfully');
      }
      
      setIsBlockEditorOpen(false);
    } catch (error) {
      console.error('Error saving content block:', error);
      toast.error(`Failed to ${editingBlock ? 'update' : 'create'} content block`);
    }
  };

  if (isLoading && !module) {
    return (
      <PageLayout
        title="Loading..."
        backHref={`/dashboard/instructor/courses/${courseId}/modules`}
      >
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={module?.title || 'Module Details'}
      backHref={`/dashboard/instructor/courses/${courseId}/modules`}
    >
      <div className="space-y-6">
        {/* Header with navigation and module info */}
        <div className="border-b pb-4">
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules`)}
              className="mb-2 pl-0 hover:pl-0 hover:bg-transparent w-fit"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Modules
            </Button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{module?.title}</h1>
                <p className="text-muted-foreground mt-1">{module?.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Eye size={16} /> Preview
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <Settings size={16} /> Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Module tabs and content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="content" className="flex items-center gap-1">
              <LayoutGrid size={16} /> Content
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-1">
              <FileText size={16} /> Projects ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="discussions" className="flex items-center gap-1">
              <MessageCircle size={16} /> Discussions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart4 size={16} /> Analytics
            </TabsTrigger>
          </TabsList>
          
          {/* Content Tab */}
          <TabsContent value="content" className="p-0 border-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Sidebar with pages */}
              <div className="md:col-span-3 space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium">Pages</h2>
                      <Badge variant="secondary">{pages.length}</Badge>
                    </div>
                    <ModulePages 
                      courseId={courseId} 
                      moduleId={moduleId}
                      initialPages={pages}
                      onPageSelect={handleSelectPage}
                      onPagesChange={(updatedPages) => {
                        setPages(updatedPages);
                        // If there are pages but no active page, activate the first one
                        if (updatedPages.length > 0 && !activePage) {
                          handleSelectPage(updatedPages[0]);
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
              
              {/* Content area */}
              <div className="md:col-span-9 space-y-4">
                {activePage ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-xl font-semibold">{activePage.title}</h2>
                          <p className="text-muted-foreground text-sm">Add and arrange content for this page</p>
                        </div>
                        
                        <div className="flex gap-2">
                          {blocks.length > 1 && (
                            <Button variant="outline" size="sm" className="gap-1">
                              <GripVertical size={16} /> {isSorting ? 'Saving...' : 'Reorder'}
                            </Button>
                          )}
                          <Button onClick={() => handleAddBlock()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                      
                      {blocks.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                            <p className="text-muted-foreground mb-4">No content blocks yet</p>
                            <div className="flex flex-wrap justify-center gap-2">
                              <Button onClick={() => handleAddBlock('text')} variant="outline" size="sm" 
                                className="gap-1 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                                <FileText size={14} className="text-blue-500" /> Text
                              </Button>
                              <Button onClick={() => handleAddBlock('video')} variant="outline" size="sm" 
                                className="gap-1 hover:bg-purple-50 hover:border-purple-200 transition-colors">
                                <Video size={14} className="text-purple-500" /> Video
                              </Button>
                              <Button onClick={() => handleAddBlock('project')} variant="outline" size="sm" 
                                className="gap-1 hover:bg-emerald-50 hover:border-emerald-200 transition-colors">
                                <Code size={14} className="text-emerald-500" /> Project
                              </Button>
                              <Button onClick={() => handleAddBlock('assignment')} variant="outline" size="sm" 
                                className="gap-1 hover:bg-amber-50 hover:border-amber-200 transition-colors">
                                <FileCheck2 size={14} className="text-amber-500" /> Assignment
                              </Button>
                              <Button onClick={() => handleAddBlock('quiz')} variant="outline" size="sm" 
                                className="gap-1 hover:bg-pink-50 hover:border-pink-200 transition-colors">
                                <ListChecks size={14} className="text-pink-500" /> Quiz
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={blocks.map(block => block.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-4">
                              {blocks
                                .slice() // Create a copy to avoid mutation during sort
                                .sort((a, b) => a.order - b.order)
                                .map((block) => (
                                  <SortableItem
                                    key={block.id}
                                    id={block.id}
                                    block={block}
                                    onEdit={() => handleEditBlock(block)}
                                    onDelete={() => handleDeleteBlock(block.id)}
                                  />
                                ))
                              }
                              {isSorting && (
                                <div className="fixed inset-0 bg-black/5 flex items-center justify-center z-50">
                                  <div className="bg-white p-4 rounded-md shadow-lg flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    <p>Saving block order...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/20">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {pages.length === 0 
                        ? "No pages yet. Create your first page to add content." 
                        : "Select a page from the sidebar to view and edit its content."}
                    </p>
                    {pages.length === 0 && (
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Page
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Optional content guidelines card */}
                {activePage && (
                  <Card className="bg-muted/20 border-dashed">
                    <CardContent className="p-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span>Pro tips: Add multimedia content, keep text sections concise, and use quizzes to reinforce learning.</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Projects Tab */}
          <TabsContent value="projects" className="p-0 border-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Module Projects</h3>
                <Button 
                  onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/project/create`)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </div>
              
              {projects.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get started by creating a new project.
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/project/create`)}
                    >
                      <Plus className="-ml-1 mr-2 h-5 w-5" />
                      New Project
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{project.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {project.description || 'No description'}
                            </p>
                            {project.dueDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Due: {new Date(project.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/projects/${project.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Discussions Tab */}
          <TabsContent value="discussions" className="p-0 border-0">
            <ModuleDiscussions courseId={courseId} moduleId={moduleId} />
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="p-0 border-0">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">Module Analytics</h2>
                    <p className="text-muted-foreground text-sm">Track student engagement and performance</p>
                  </div>
                </div>
                
                <div className="text-center py-12">
                  <BarChart4 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Analytics data will appear here once students start engaging with this module</p>
                  <p className="text-xs text-muted-foreground">You'll be able to track completion rates, time spent, quiz scores, and more</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Content Block Editor Dialog */}
      {activePage !== null && (
        <ContentBlockEditor
          courseId={courseId}
          moduleId={moduleId}
          pageId={activePage.id}
          block={editingBlock}
          isOpen={isBlockEditorOpen}
          onClose={() => setIsBlockEditorOpen(false)}
          onSave={handleSaveBlock}
          selectedType={selectedBlockType}
        />
      )}
    </PageLayout>
  );
}
