'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { 
  ArrowLeft, 
  Eye, 
  FileText, 
  Loader2, 
  MessageCircle,
  Plus,
  Settings, 
  BookOpen,
  HelpCircle, 
  CheckCircle2, 
  GripVertical, 
  Video, 
  FileCheck2, 
  Code,
  Clock, 
  Calendar, 
  ListChecks,
  PlayCircle,
  PenTool,
  Trophy,
  Users,
  Target,
  Zap,
  Star,
  TrendingUp,
  Award,
  Bookmark,
  Monitor,
  Headphones,
  FileVideo,
  Edit3,
  Brain,
  Lightbulb,
  Sparkles,
  Rocket,
  Timer,
  CheckSquare,
  MessageSquare,
  FolderOpen,
  Layers,
  Activity
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
        <div className="flex justify-center items-center min-h-[60vh] min-w-0">
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
      <div className="space-y-4 lg:space-y-6">
        {/* Header with navigation and module info */}
        <div className="border-b pb-4">
          <div className="flex flex-col gap-2 min-w-0">
            <Button
              variant="ghost"
              onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules`)}
              className="mb-2 pl-0 hover:pl-0 hover:bg-transparent w-fit"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Modules
            </Button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold break-words">{module?.title}</h1>
                <p className="text-muted-foreground mt-1">{module?.description}</p>
              </div>
              <div className="flex items-center gap-2 min-w-0">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 lg:space-y-6">
          <TabsList className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-1.5 rounded-xl shadow-sm border">
            <TabsTrigger 
              value="pages" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 break-words min-w-0 flex-shrink-0"
            >
              <div className="p-1 rounded-md bg-blue-100 text-blue-600">
                <Layers size={14} />
              </div>
              <span>Pages</span>
              <Badge variant="secondary" className="ml-1 bg-blue-50 text-blue-600 border-blue-200">{pages.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="lessons" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-600 break-words min-w-0 flex-shrink-0"
            >
              <div className="p-1 rounded-md bg-emerald-100 text-emerald-600">
                <PlayCircle size={14} />
              </div>
              <span>Lessons</span>
              <Badge variant="secondary" className="ml-1 bg-emerald-50 text-emerald-600 border-emerald-200">{lessons.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="assignments" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-amber-600 break-words min-w-0 flex-shrink-0"
            >
              <div className="p-1 rounded-md bg-amber-100 text-amber-600">
                <PenTool size={14} />
              </div>
              <span>Assignments</span>
              <Badge variant="secondary" className="ml-1 bg-amber-50 text-amber-600 border-amber-200">{assignments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="quizzes" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 break-words min-w-0 flex-shrink-0"
            >
              <div className="p-1 rounded-md bg-purple-100 text-purple-600">
                <Brain size={14} />
              </div>
              <span>Quizzes</span>
              <Badge variant="secondary" className="ml-1 bg-purple-50 text-purple-600 border-purple-200">{quizzes.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="projects" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600 break-words min-w-0 flex-shrink-0"
            >
              <div className="p-1 rounded-md bg-indigo-100 text-indigo-600">
                <Rocket size={14} />
              </div>
              <span>Projects</span>
              <Badge variant="secondary" className="ml-1 bg-indigo-50 text-indigo-600 border-indigo-200">{projects.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="forum" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-rose-600 break-words min-w-0 flex-shrink-0"
            >
              <div className="p-1 rounded-md bg-rose-100 text-rose-600">
                <MessageSquare size={14} />
              </div>
              <span>Discussion</span>
              <Badge variant="secondary" className="ml-1 bg-rose-50 text-rose-600 border-rose-200">{forumTopics.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          {/* Pages Tab */}
          <TabsContent value="pages" className="p-0 border-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
              {/* Sidebar with pages */}
              <div className="md:col-span-3 space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4 min-w-0">
                      <h2 className="text-lg font-medium break-words">Pages</h2>
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
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex justify-between items-center mb-6 min-w-0">
                        <div>
                          <h2 className="text-xl font-semibold break-words">{activePage.title}</h2>
                          <p className="text-muted-foreground text-sm break-words">Add and arrange content for this page</p>
                        </div>
                        
                        <div className="flex gap-2 min-w-0">
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
                          <div className="flex flex-col items-center gap-2 min-w-0">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                            <p className="text-muted-foreground mb-4">No content blocks yet</p>
                            <div className="flex flex-wrap justify-center gap-2 min-w-0">
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
                                <div className="fixed inset-0 bg-black/5 flex items-center justify-center z-50 min-w-0">
                                  <div className="bg-white p-4 rounded-md shadow-lg flex items-center gap-2 min-w-0 overflow-hidden">
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
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/20 min-w-0">
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
                    <CardContent className="p-4 text-sm break-words">
                      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
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
            <div className="space-y-4 lg:space-y-6">
              {/* Header Card */}
              <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-3 rounded-xl bg-indigo-100">
                        <Rocket className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-indigo-900 break-words">Hands-on Projects</h2>
                        <p className="text-indigo-700 text-sm break-words">Build real-world skills with practical coding challenges</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/project/create`)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="mr-2 h-4 w-4" /> 
                      <span>Create Project</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Projects Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {projects.length === 0 ? (
                  <div className="lg:col-span-2">
                    <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50/30">
                      <CardContent className="p-12 flex flex-col items-center justify-center text-center min-w-0">
                        <div className="p-4 rounded-full bg-indigo-100 mb-4">
                          <Code className="h-12 w-12 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-indigo-900 break-words">Launch your first project</h3>
                        <p className="text-indigo-700 text-sm mb-6 max-w-md break-words">Projects provide hands-on experience and help students apply their knowledge. Create coding challenges, portfolios, or real-world applications.</p>
                        <div className="flex flex-col sm:flex-row gap-3 min-w-0">
                          <Button 
                            onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/project/create`)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            <Rocket className="mr-2 h-4 w-4" /> 
                            Create Project
                          </Button>
                          <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                            <FolderOpen className="mr-2 h-4 w-4" /> 
                            Browse Templates
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  projects.map((project, index) => (
                    <Card key={project.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-indigo-100 hover:border-indigo-200">
                      <CardContent className="p-0">
                        {/* Project Header */}
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-b border-indigo-100">
                          <div className="flex justify-between items-start mb-3 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 flex-shrink-0">
                                <Code size={16} />
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full break-words">
                                  Project {index + 1}
                                </span>
                                <Badge variant={project.isPublished ? 'default' : 'outline'} className="text-xs">
                                  {project.isPublished ? 'Published' : 'Draft'}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/projects/${project.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <h3 className="font-semibold text-indigo-900 mb-2 line-clamp-1 break-words">{project.title}</h3>
                          <p className="text-sm text-indigo-700 line-clamp-2 break-words">
                            {project.description || 'No description available'}
                          </p>
                        </div>
                        
                        {/* Project Stats */}
                        <div className="p-4 lg:p-6">
                          <div className="flex items-center justify-between text-sm mb-4 break-words min-w-0">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="flex items-center gap-1 text-indigo-600 min-w-0">
                                <Calendar size={14} />
                                <span className="font-medium break-words">
                                  {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No deadline'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-600 min-w-0">
                                <Users size={14} />
                                <span>{(project as any)._count?.submissions || 0} submissions</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 min-w-0">
                              <Trophy size={14} />
                              <span className="text-xs">{(project as any).difficulty || 'Medium'}</span>
                            </div>
                          </div>
                          
                          {/* Project Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center min-w-0">
                              <span className="text-xs text-slate-600">Completion Rate</span>
                              <span className="text-xs font-medium text-indigo-600 break-words">0%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div className="bg-indigo-500 h-2 rounded-full" style={{width: '0%'}}></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 min-w-0">
                              <span>0 completed</span>
                              <span>0 reviewed</span>
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

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="p-0 border-0">
            <div className="space-y-4 lg:space-y-6">
              {/* Header Card */}
              <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-3 rounded-xl bg-emerald-100">
                        <PlayCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-emerald-900 break-words">Video Lessons</h2>
                        <p className="text-emerald-700 text-sm break-words">Engage students with interactive video content</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lesson/create`)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="mr-2 h-4 w-4" /> 
                      <span>Create Lesson</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Lessons Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {!Array.isArray(lessons) || lessons.length === 0 ? (
                  <div className="lg:col-span-2">
                    <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/30">
                      <CardContent className="p-12 flex flex-col items-center justify-center text-center min-w-0">
                        <div className="p-4 rounded-full bg-emerald-100 mb-4">
                          <Monitor className="h-12 w-12 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-emerald-900 break-words">Ready to create your first lesson?</h3>
                        <p className="text-emerald-700 text-sm mb-6 max-w-md break-words">Lessons are the core of your course. Add videos, text content, and interactive elements to engage your students.</p>
                        <div className="flex flex-col sm:flex-row gap-3 min-w-0">
                          <Button 
                            onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lesson/create`)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Sparkles className="mr-2 h-4 w-4" /> 
                            Create Your First Lesson
                          </Button>
                          <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            <Lightbulb className="mr-2 h-4 w-4" /> 
                            View Best Practices
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  lessons.map((lesson, index) => (
                    <Card key={lesson.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-emerald-100 hover:border-emerald-200">
                      <CardContent className="p-0">
                        {/* Lesson Header */}
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 border-b border-emerald-100">
                          <div className="flex justify-between items-start mb-3 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                                {lesson.videoUrl ? <FileVideo size={16} /> : <FileText size={16} />}
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full break-words">
                                  Lesson {index + 1}
                                </span>
                                <Badge variant={(lesson as any).isPublished ? 'default' : 'outline'} className="text-xs">
                                  {(lesson as any).isPublished ? 'Published' : 'Draft'}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <h3 className="font-semibold text-emerald-900 mb-2 line-clamp-1 break-words">{lesson.title}</h3>
                          <p className="text-sm text-emerald-700 line-clamp-2 break-words">
                            {lesson.description || 'No description available'}
                          </p>
                        </div>
                        
                        {/* Lesson Stats */}
                        <div className="p-4 lg:p-6">
                          <div className="flex items-center justify-between text-sm break-words min-w-0">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="flex items-center gap-1 text-emerald-600 min-w-0">
                                {lesson.videoUrl ? <Headphones size={14} /> : <FileText size={14} />}
                                <span className="font-medium break-words">{lesson.videoUrl ? 'Video' : 'Text'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-600 min-w-0">
                                <Timer size={14} />
                                <span>{lesson.duration ? `${lesson.duration} min` : 'No duration'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 min-w-0">
                              <Activity size={14} />
                              <span className="text-xs">0 views</span>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2 min-w-0">
                              <span className="text-xs text-slate-600">Completion Rate</span>
                              <span className="text-xs font-medium text-emerald-600 break-words">0%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div className="bg-emerald-500 h-2 rounded-full" style={{width: '0%'}}></div>
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
            <div className="space-y-4 lg:space-y-6">
              {/* Header Card */}
              <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-3 rounded-xl bg-amber-100">
                        <PenTool className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-amber-900 break-words">Assignments</h2>
                        <p className="text-amber-700 text-sm break-words">Assess student understanding with practical tasks</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/assignment/create`)}
                      className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="mr-2 h-4 w-4" /> 
                      <span>Create Assignment</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Assignments Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {assignments.length === 0 ? (
                  <div className="lg:col-span-2">
                    <Card className="border-dashed border-2 border-amber-200 bg-amber-50/30">
                      <CardContent className="p-12 flex flex-col items-center justify-center text-center min-w-0">
                        <div className="p-4 rounded-full bg-amber-100 mb-4">
                          <CheckSquare className="h-12 w-12 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-amber-900 break-words">Create your first assignment</h3>
                        <p className="text-amber-700 text-sm mb-6 max-w-md break-words">Assignments help you evaluate student progress and understanding. Set deadlines, rubrics, and provide detailed feedback.</p>
                        <div className="flex flex-col sm:flex-row gap-3 min-w-0">
                          <Button 
                            onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/assignment/create`)}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            <Target className="mr-2 h-4 w-4" /> 
                            Create Assignment
                          </Button>
                          <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                            <Trophy className="mr-2 h-4 w-4" /> 
                            View Rubric Templates
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  assignments.map((assignment, index) => (
                    <Card key={assignment.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-amber-100 hover:border-amber-200">
                      <CardContent className="p-0">
                        {/* Assignment Header */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-amber-100">
                          <div className="flex justify-between items-start mb-3 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-amber-100 text-amber-600 flex-shrink-0">
                                <Edit3 size={16} />
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full break-words">
                                  Assignment {index + 1}
                                </span>
                                <Badge variant={assignment.isPublished ? 'default' : 'outline'} className="text-xs">
                                  {assignment.isPublished ? 'Published' : 'Draft'}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/assignments/${assignment.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <h3 className="font-semibold text-amber-900 mb-2 line-clamp-1 break-words">{assignment.title}</h3>
                          <p className="text-sm text-amber-700 line-clamp-2 break-words">
                            {assignment.description || 'No description available'}
                          </p>
                        </div>
                        
                        {/* Assignment Stats */}
                        <div className="p-4 lg:p-6">
                          <div className="flex items-center justify-between text-sm mb-4 break-words min-w-0">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="flex items-center gap-1 text-amber-600 min-w-0">
                                <Calendar size={14} />
                                <span className="font-medium break-words">
                                  {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-600 min-w-0">
                                <Users size={14} />
                                <span>{(assignment as any)._count?.submissions || 0} submissions</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 min-w-0">
                              <Star size={14} />
                              <span className="text-xs">{(assignment as any).pointsValue || 100} pts</span>
                            </div>
                          </div>
                          
                          {/* Submission Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center min-w-0">
                              <span className="text-xs text-slate-600">Submission Rate</span>
                              <span className="text-xs font-medium text-amber-600 break-words">0%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div className="bg-amber-500 h-2 rounded-full" style={{width: '0%'}}></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 min-w-0">
                              <span>0 submitted</span>
                              <span>0 graded</span>
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

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="p-0 border-0">
            <div className="space-y-4 lg:space-y-6">
              {/* Header Card */}
              <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-3 rounded-xl bg-purple-100">
                        <Brain className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-purple-900 break-words">Knowledge Quizzes</h2>
                        <p className="text-purple-700 text-sm break-words">Test student understanding with interactive assessments</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quiz/create`)}
                      className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="mr-2 h-4 w-4" /> 
                      <span>Create Quiz</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Quizzes Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {quizzes.length === 0 ? (
                  <div className="lg:col-span-2">
                    <Card className="border-dashed border-2 border-purple-200 bg-purple-50/30">
                      <CardContent className="p-12 flex flex-col items-center justify-center text-center min-w-0">
                        <div className="p-4 rounded-full bg-purple-100 mb-4">
                          <Zap className="h-12 w-12 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-purple-900 break-words">Ready to test knowledge?</h3>
                        <p className="text-purple-700 text-sm mb-6 max-w-md break-words">Quizzes help reinforce learning and provide instant feedback. Create multiple choice, true/false, or open-ended questions.</p>
                        <div className="flex flex-col sm:flex-row gap-3 min-w-0">
                          <Button 
                            onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quiz/create`)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Lightbulb className="mr-2 h-4 w-4" /> 
                            Create Your First Quiz
                          </Button>
                          <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                            <Award className="mr-2 h-4 w-4" /> 
                            View Question Bank
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  quizzes.map((quiz, index) => (
                    <Card key={quiz.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-purple-100 hover:border-purple-200">
                      <CardContent className="p-0">
                        {/* Quiz Header */}
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 border-b border-purple-100">
                          <div className="flex justify-between items-start mb-3 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 flex-shrink-0">
                                <HelpCircle size={16} />
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full break-words">
                                  Quiz {index + 1}
                                </span>
                                <Badge variant={quiz.isPublished ? 'default' : 'outline'} className="text-xs">
                                  {quiz.isPublished ? 'Published' : 'Draft'}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quizzes/${quiz.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <h3 className="font-semibold text-purple-900 mb-2 line-clamp-1 break-words">{quiz.title}</h3>
                          <p className="text-sm text-purple-700 line-clamp-2 break-words">
                            {quiz.description || 'No description available'}
                          </p>
                        </div>
                        
                        {/* Quiz Stats */}
                        <div className="p-4 lg:p-6">
                          <div className="flex items-center justify-between text-sm mb-4 break-words min-w-0">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="flex items-center gap-1 text-purple-600 min-w-0">
                                <Timer size={14} />
                                <span className="font-medium break-words">
                                  {quiz.timeLimit ? `${quiz.timeLimit} min` : 'Untimed'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-600 min-w-0">
                                <TrendingUp size={14} />
                                <span>Pass: {quiz.passingScore || 60}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 min-w-0">
                              <Bookmark size={14} />
                              <span className="text-xs">{(quiz as any).questionCount || 0} questions</span>
                            </div>
                          </div>
                          
                          {/* Quiz Performance */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center min-w-0">
                              <span className="text-xs text-slate-600">Average Score</span>
                              <span className="text-xs font-medium text-purple-600 break-words">0%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{width: '0%'}}></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 min-w-0">
                              <span>0 attempts</span>
                              <span>0 passed</span>
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
          
          {/* Forum/Discussion Tab */}
          <TabsContent value="forum" className="p-0 border-0">
            <div className="space-y-4 lg:space-y-6">
              {/* Header Card */}
              <Card className="border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-3 rounded-xl bg-rose-100">
                        <MessageSquare className="h-6 w-6 text-rose-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-rose-900 break-words">Discussion Forum</h2>
                        <p className="text-rose-700 text-sm break-words">Foster collaboration and peer learning through discussions</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forum/new-topic`)}
                      className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="mr-2 h-4 w-4" /> 
                      <span>Start Discussion</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Forum Topics Grid */}
              <div className="grid grid-cols-1 gap-4">
                {forumTopics.length === 0 ? (
                  <Card className="border-dashed border-2 border-rose-200 bg-rose-50/30">
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center min-w-0">
                      <div className="p-4 rounded-full bg-rose-100 mb-4">
                        <Users className="h-12 w-12 text-rose-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-rose-900 break-words">Start meaningful conversations</h3>
                      <p className="text-rose-700 text-sm mb-6 max-w-md break-words">Forums encourage peer-to-peer learning and help build a learning community. Start discussions, ask questions, and facilitate knowledge sharing.</p>
                      <div className="flex flex-col sm:flex-row gap-3 min-w-0">
                        <Button 
                          onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forum/new-topic`)}
                          className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" /> 
                          Start First Discussion
                        </Button>
                        <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50">
                          <Lightbulb className="mr-2 h-4 w-4" /> 
                          Discussion Guidelines
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  forumTopics.map((topic, index) => (
                    <Card key={topic.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-rose-100 hover:border-rose-200">
                      <CardContent className="p-0">
                        {/* Topic Header */}
                        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 border-b border-rose-100">
                          <div className="flex justify-between items-start mb-3 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-rose-100 text-rose-600 flex-shrink-0">
                                <MessageCircle size={16} />
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-medium text-rose-600 bg-rose-100 px-2 py-1 rounded-full break-words">
                                  Topic {index + 1}
                                </span>
                                {topic.isPinned && (
                                  <Badge variant="default" className="text-xs bg-rose-600">
                                    Pinned
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forum/topics/${topic.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <h3 className="font-semibold text-rose-900 mb-2 line-clamp-1 break-words">{topic.title}</h3>
                          <p className="text-sm text-rose-700 line-clamp-2 break-words">
                            {topic.description || 'No description available'}
                          </p>
                        </div>
                        
                        {/* Topic Stats */}
                        <div className="p-4 lg:p-6">
                          <div className="flex items-center justify-between text-sm mb-4 break-words min-w-0">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="flex items-center gap-1 text-rose-600 min-w-0">
                                <Clock size={14} />
                                <span className="font-medium break-words">
                                  {topic.lastActivity ? new Date(topic.lastActivity).toLocaleDateString() : 'No activity'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-600 min-w-0">
                                <MessageCircle size={14} />
                                <span>{topic.postCount || 0} replies</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 min-w-0">
                              <Users size={14} />
                              <span className="text-xs">{(topic as any).participantCount || 0} participants</span>
                            </div>
                          </div>
                          
                          {/* Engagement Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center min-w-0">
                              <span className="text-xs text-slate-600">Engagement Level</span>
                              <span className="text-xs font-medium text-rose-600 break-words">
                                {topic.postCount > 10 ? 'High' : topic.postCount > 5 ? 'Medium' : 'Low'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-rose-500 h-2 rounded-full transition-all duration-300" 
                                style={{
                                  width: `${Math.min((topic.postCount || 0) * 10, 100)}%`
                                }}
                              ></div>
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
