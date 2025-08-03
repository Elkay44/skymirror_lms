'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { 
  ArrowLeft, 
  Eye, 
  FileText, 
  LayoutGrid, 
  Loader2, 
  MessageCircle,
  Plus,
  Settings, 
  BookOpen,
  ClipboardList,
  HelpCircle, 
  GraduationCap, 
  CheckCircle2, 
  GripVertical, 
  Video, 
  FileCheck2, 
  Code,
  Clock, 
  Calendar, 
  ListChecks
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { ModulePages } from './_components/ModulePages';
import { ContentBlockEditor } from './_components/ContentBlockEditor';

import { PageLayout } from '../../_components/PageLayout';
import { 
  Module, 
  ModulePage, 
  ContentBlock, 
  ContentBlockType
} from '@/types/module';
// Use relative paths for module imports to avoid resolution issues
import { Project } from '../../../../../../../types/project';

import { Lesson } from '../../../../../../../types/lesson';
import { Assignment } from '../../../../../../../types/assignment';
import { Quiz } from '../../../../../../../types/quiz';
import { ForumTopic } from '../../../../../../../types/forum';
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
import { getModuleProjects } from '../../../../../../../lib/api/projects';
import { getModuleLessons } from '../../../../../../../lib/api/lessons';
import { getModuleAssignments } from '../../../../../../../lib/api/assignments';
import { getModuleQuizzes } from '../../../../../../../lib/api/quizzes';
import { getModuleTopics } from '../../../../../../../lib/api/forums';

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
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlockEditorOpen, setIsBlockEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | undefined>(undefined);
  const [selectedBlockType, setSelectedBlockType] = useState<ContentBlockType>('text');
  const [activeTab, setActiveTab] = useState('pages');
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
      
      // Fetch module details and all content types
      const [
        moduleData, 
        pagesResponse, 
        projectsData,
        lessonsData,
        assignmentsData,
        quizzesData,
        forumTopicsData
      ] = await Promise.all([
        getModule(courseId, moduleId),
        getModulePages(courseId, moduleId),
        getModuleProjects(courseId, moduleId).catch(() => []),
        getModuleLessons(courseId, moduleId).catch(() => []),
        getModuleAssignments(courseId, moduleId).catch(() => []),
        getModuleQuizzes(courseId, moduleId).catch(() => []),
        getModuleTopics(courseId, moduleId).catch(() => [])
      ]);
      
      setModule(moduleData);
      
      // Extract pages from the response
      const pages = pagesResponse.data;
      setPages(pages);
      
      // Set all content types
      setProjects(Array.isArray(projectsData) ? projectsData as Project[] : []);
      setLessons(Array.isArray(lessonsData) ? lessonsData as Lesson[] : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData as Assignment[] : []);
      // Quiz API now returns array directly from getModuleQuizzes function
      setQuizzes(Array.isArray(quizzesData) ? quizzesData as Quiz[] : []);
      setForumTopics(Array.isArray(forumTopicsData) ? forumTopicsData as ForumTopic[] : []);
      
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
            <TabsTrigger value="pages" className="flex items-center gap-1">
              <LayoutGrid size={16} /> Pages ({pages.length})
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center gap-1">
              <BookOpen size={16} /> Lessons ({lessons.length})
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-1">
              <ClipboardList size={16} /> Assignments ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-1">
              <HelpCircle size={16} /> Quizzes ({quizzes.length})
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-1">
              <FileText size={16} /> Projects ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="forum" className="flex items-center gap-1">
              <MessageCircle size={16} /> Discussion ({forumTopics.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Pages Tab */}
          <TabsContent value="pages" className="p-0 border-0">
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
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Projects</h2>
                    <Button size="sm" onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/project/create`)}>
                      <Plus className="mr-1 h-4 w-4" /> Add Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 gap-4">
                {projects.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">Create projects to give hands-on practice to students</p>
                      <Button onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/project/create`)}>
                        <Plus className="mr-1 h-4 w-4" /> Create Project
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  projects.map((project) => (
                    <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="bg-primary/5 p-4 border-b">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{project.title}</h3>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/projects/${project.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.description || 'No description available'}
                          </p>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>Due {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}</span>
                              </div>
                              <div className="flex items-center">
                                <ListChecks className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{(project as any)._count?.submissions || 0} Submissions</span>
                              </div>
                            </div>
                            <Badge variant={project.isPublished ? 'default' : 'outline'}>
                              {project.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="p-0 border-0">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Lessons</h2>
                    <Button size="sm" onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lesson/create`)}>
                      <Plus className="mr-1 h-4 w-4" /> Add Lesson
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 gap-4">
                {!Array.isArray(lessons) || lessons.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium mb-2">No lessons yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">Create lessons to teach students course material</p>
                      <Button onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lesson/create`)}>
                        <Plus className="mr-1 h-4 w-4" /> Create Lesson
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  lessons.map((lesson) => (
                    <Card key={lesson.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="bg-primary/5 p-4 border-b">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{lesson.title}</h3>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {lesson.description || 'No description available'}
                          </p>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <Video className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{lesson.videoUrl ? 'Video lesson' : 'Text lesson'}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{lesson.duration ? `${lesson.duration} min` : 'No duration set'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="p-0 border-0">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Assignments</h2>
                    <Button size="sm" onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/assignment/create`)}>
                      <Plus className="mr-1 h-4 w-4" /> Add Assignment
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 gap-4">
                {assignments.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">Create assignments to assess student learning</p>
                      <Button onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/assignment/create`)}>
                        <Plus className="mr-1 h-4 w-4" /> Create Assignment
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  assignments.map((assignment) => (
                    <Card key={assignment.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="bg-primary/5 p-4 border-b">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{assignment.title}</h3>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/assignments/${assignment.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {assignment.description || 'No description available'}
                          </p>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Not set'}</span>
                              </div>
                              <div className="flex items-center">
                                <ListChecks className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{(assignment as any)._count?.submissions || 0} Submissions</span>
                              </div>
                            </div>
                            <Badge variant={assignment.isPublished ? 'default' : 'outline'}>
                              {assignment.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="p-0 border-0">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Quizzes</h2>
                    <Button size="sm" onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quiz/create`)}>
                      <Plus className="mr-1 h-4 w-4" /> Add Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 gap-4">
                {quizzes.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <HelpCircle className="h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium mb-2">No quizzes yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">Create quizzes to test student knowledge</p>
                      <Button onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quiz/create`)}>
                        <Plus className="mr-1 h-4 w-4" /> Create Quiz
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  quizzes.map((quiz) => (
                    <Card key={quiz.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="bg-primary/5 p-4 border-b">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{quiz.title}</h3>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quizzes/${quiz.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {quiz.description || 'No description available'}
                          </p>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{quiz.timeLimit ? `${quiz.timeLimit} min` : 'No time limit'}</span>
                              </div>
                              <div className="flex items-center">
                                <GraduationCap className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>Pass: {quiz.passingScore || 60}%</span>
                              </div>
                            </div>
                            <Badge variant={quiz.isPublished ? 'default' : 'outline'}>
                              {quiz.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Forum/Discussion Tab */}
          <TabsContent value="forum" className="p-0 border-0">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Discussion Forum</h2>
                    <Button size="sm" onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forum/new-topic`)}>
                      <Plus className="mr-1 h-4 w-4" /> Start Discussion
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 gap-4">
                {forumTopics.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium mb-2">No discussions yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">Start a discussion to engage with your students</p>
                      <Button onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forum/new-topic`)}>
                        <Plus className="mr-1 h-4 w-4" /> Start Discussion
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  forumTopics.map((topic) => (
                    <Card key={topic.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="bg-primary/5 p-4 border-b">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{topic.title}</h3>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forum/topics/${topic.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {topic.description || 'No description available'}
                          </p>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>Last activity: {topic.lastActivity ? new Date(topic.lastActivity).toLocaleDateString() : 'None'}</span>
                              </div>
                              <div className="flex items-center">
                                <MessageCircle className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{topic.postCount || 0} Posts</span>
                              </div>
                            </div>
                            {topic.isPinned && (
                              <Badge variant="default">Pinned</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
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
