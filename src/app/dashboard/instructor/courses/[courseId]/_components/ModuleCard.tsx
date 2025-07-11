'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GripVertical, MoreHorizontal, BookOpen, Clock, Lock, CheckCircle2, Edit, Trash2, Plus, Users, Target, FileText, Video, Link, Play, File, Upload, ChevronDown, ChevronRight, Book, BookText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleBase as Module, ModuleStatus, Lesson, ModulePage, LearningObjective } from '@/types/module';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ModuleCardProps {
  module: Module;
  onEdit: (module: Module) => void;
  onDelete: (moduleId: string) => void;
  className?: string;
  dragHandleProps?: any;
}

const statusConfig: Record<ModuleStatus, { color: string; icon: React.ComponentType<any>; label: string }> = {
  draft: { 
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200', 
    icon: Clock, 
    label: 'Draft' 
  },
  published: { 
    color: 'bg-green-50 text-green-700 border-green-200', 
    icon: CheckCircle2, 
    label: 'Published' 
  },
  scheduled: { 
    color: 'bg-blue-50 text-blue-700 border-blue-200', 
    icon: Clock, 
    label: 'Scheduled' 
  },
};

export function ModuleCard({ 
  module, 
  onEdit, 
  onDelete, 
  className,
  dragHandleProps,
}: ModuleCardProps) {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  
  const config = statusConfig[module.status] || statusConfig.draft;
  const StatusIcon = config.icon;
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [pages, setPages] = useState<ModulePage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddOption = (type: string) => {
    // Close the dropdown
    setShowAddOptions(false);
    
    // Navigate to the creation page for the selected content type
    router.push(`/dashboard/instructor/courses/${courseId}/modules/${module.id}/${type}/create`);
  };
  
  // Fetch module content when expanded
  useEffect(() => {
    if (isExpanded && (!lessons.length && !pages.length)) {
      fetchModuleContent();
    }
  }, [isExpanded]);
  
  // Fetch module content (lessons and pages)
  const fetchModuleContent = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Fetch lessons for the module
      const lessonsResponse = await fetch(`/api/courses/${courseId}/modules/${module.id}/lessons`);
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        setLessons(lessonsData.data || []);
      }
      
      // Fetch pages for the module
      const pagesResponse = await fetch(`/api/courses/${courseId}/modules/${module.id}/pages`);
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        setPages(pagesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching module content:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to content item
  const handleContentClick = (type: 'lesson' | 'page', id: string) => {
    router.push(`/dashboard/instructor/courses/${courseId}/modules/${module.id}/${type}/${id}`);
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Close the add options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking within the dropdown itself
      const target = e.target as HTMLElement;
      if (target.closest('[data-add-dropdown]')) {
        return;
      }
      setShowAddOptions(false);
    };
    
    if (showAddOptions) {
      // Use setTimeout to add event listener in the next tick
      // This prevents the event from immediately closing the dropdown
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAddOptions]);

  return (
    <div 
      className={cn(
        'group relative bg-white border border-gray-200 rounded-xl overflow-visible',
        'transition-all duration-200 ease-in-out',
        'hover:shadow-lg hover:border-gray-300 hover:-translate-y-1',
        className
      )}
    >
      {/* Top border indicator */}
      <div className={cn(
        'h-1 w-full',
        module.status === 'published' ? 'bg-green-500' : 
        module.status === 'scheduled' ? 'bg-blue-500' : 'bg-yellow-500'
      )} />
      
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div 
            className="flex items-start gap-3 flex-1 cursor-pointer"
            onClick={toggleExpanded}
          >
            {dragHandleProps && (
              <button
                {...dragHandleProps}
                className="mt-1 p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing"
                onClick={(e) => e.stopPropagation()} // Prevent module toggle when using drag handle
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            
            <div className="flex items-center mt-1 text-gray-500">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                  {module.title}
                </h3>
                <Badge 
                  variant="outline" 
                  className={cn("border", config.color)}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              
              {module.description && (
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                  {module.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <div className="absolute top-0 right-0 z-50 overflow-visible">
              <DropdownMenu>
                <DropdownMenuTrigger className="h-8 w-8 rounded-md bg-gray-100 text-gray-700 shadow-sm border border-gray-200 transition-all duration-150 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[180px] p-1 bg-white rounded-lg shadow-lg border border-gray-200 animate-in fade-in-50 zoom-in-95 z-[100] mt-1">
                  <DropdownMenuItem onClick={() => onEdit(module)} className="px-3 py-2 text-sm rounded-md hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Module
                  </DropdownMenuItem>
                  {/* Use a regular div instead of DropdownMenuItem to prevent automatic closing */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setShowAddOptions(prev => !prev);
                    }} 
                    className="px-3 py-2 text-sm rounded-md hover:bg-gray-50 focus:bg-gray-50 cursor-pointer relative flex items-center"
                    data-add-dropdown="trigger"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                    
                    {/* Add Options Dropdown */}
                    {showAddOptions && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 min-w-[180px] p-1 bg-white rounded-lg shadow-lg border border-gray-200 z-[110]"
                        data-add-dropdown="menu"
                      >
                        <div className="py-1 text-left">
                          <button
                            onClick={() => handleAddOption('lessons')}
                            className="w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md hover:bg-gray-50"
                          >
                            <Book className="h-4 w-4" /> Lesson
                          </button>
                          <button
                            onClick={() => handleAddOption('quizzes')}
                            className="w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md hover:bg-gray-50"
                          >
                            <Play className="h-4 w-4" /> Quiz
                          </button>
                          <button
                            onClick={() => handleAddOption('resources')}
                            className="w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md hover:bg-gray-50"
                          >
                            <FileText className="h-4 w-4" /> Resource
                          </button>
                          <button
                            onClick={() => handleAddOption('projects')}
                            className="w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md hover:bg-gray-50"
                          >
                            <Target className="h-4 w-4" /> Project
                          </button>
                          <button
                            onClick={() => handleAddOption('forums')}
                            className="w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md hover:bg-gray-50"
                          >
                            <Users className="h-4 w-4" /> Forum
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t my-1 mx-1 border-gray-100"></div>
                  <DropdownMenuItem 
                    onClick={() => onDelete(module.id)}
                    className="px-3 py-2 text-sm rounded-md hover:bg-red-50 focus:bg-red-50 text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Module
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats & Info */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">{lessons.length || 0}</span>
              <span>lessons</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                {Math.floor(module.estimatedDuration / 60)}h {module.estimatedDuration % 60}m
              </span>
            </div>
            
            {module.learningObjectives && module.learningObjectives.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4" />
                <span className="font-medium">{module.learningObjectives.length}</span>
                <span>objectives</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {module.prerequisites && module.prerequisites.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                {module.prerequisites.length} prereq
              </Badge>
            )}
            
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs hover:bg-gray-50"
                onClick={() => setShowAddOptions(!showAddOptions)}
                data-add-dropdown
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
              
              {showAddOptions && (
                <div 
                  className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-36 py-1 overflow-hidden"
                  data-add-dropdown
                >
                  <button
                    onClick={() => handleAddOption('lesson')}
                    className="w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md hover:bg-gray-50"
                  >
                    <Book className="h-4 w-4" /> Lesson
                  </button>
                  <button
                    onClick={() => handleAddOption('page')}
                    className="w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4" /> Page
                  </button>
                  <button
                    onClick={() => handleAddOption('quiz')}
                    className="w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md hover:bg-gray-50"
                  >
                    <Target className="h-4 w-4" /> Quiz
                  </button>
                  <button
                    onClick={() => handleAddOption('assignment')}
                    className="w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md hover:bg-gray-50"
                  >
                    <File className="h-4 w-4" /> Assignment
                  </button>
                  <button
                    onClick={() => handleAddOption('project')}
                    className="w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" /> Project
                  </button>
                  <button
                    onClick={() => handleAddOption('forums')}
                    className="w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md hover:bg-gray-50"
                  >
                    <Users className="h-4 w-4" /> Forum
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Module Content (Collapsible) */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.length === 0 && pages.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No content in this module yet.</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddOption('lesson');
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add content
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Lessons */}
                  {lessons.map((lesson) => (
                    <div 
                      key={`lesson-${lesson.id}`}
                      className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/instructor/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}`);
                      }}
                    >
                      <div className="text-blue-600">
                        <BookText className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{lesson.title}</p>
                      </div>
                      {/* Lesson badges could be added here if needed */}
                    </div>
                  ))}
                  
                  {/* Pages */}
                  {pages.map((page) => (
                    <div 
                      key={`page-${page.id}`}
                      className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/instructor/courses/${courseId}/modules/${module.id}/pages/${page.id}`);
                      }}
                    >
                      <div className="text-gray-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{page.title}</p>
                        {page.description && (
                          <p className="text-xs text-gray-500 truncate">{page.description}</p>
                        )}
                      </div>
                      {!page.isPublished && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                          Draft
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Learning Objectives Preview */}
      {!isExpanded && module.learningObjectives && module.learningObjectives.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Learning Objectives
            </h4>
            <div className="space-y-1">
              {module.learningObjectives.slice(0, 2).map((objective: LearningObjective | string, index: number) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="leading-relaxed">
                    {typeof objective === 'string' ? objective : objective.text}
                  </span>
                </div>
              ))}
              {module.learningObjectives.length > 2 && (
                <div className="text-xs text-gray-500 pl-3.5">
                  +{module.learningObjectives.length - 2} more objectives
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
