'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Video, FileText, FileQuestion, Code, X, ChevronUp, ChevronDown, Eye, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

type ContentType = 'video' | 'text' | 'quiz' | 'assignment' | 'resource';

interface ContentBlock {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  duration?: number;
  completed?: boolean;
  content?: any;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  isExpanded: boolean;
  contents: ContentBlock[];
}

export function CourseBuilder() {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const [title, setTitle] = useState('Untitled Course');

  // Add a new module
  const addModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: `Module ${modules.length + 1}`,
      isExpanded: true,
      contents: []
    };
    setModules([...modules, newModule]);
    setActiveModuleId(newModule.id);
  };

  // Add content to a module
  const addContent = (moduleId: string, type: ContentType) => {
    const contentTypes = {
      video: { title: 'New Video' },
      text: { title: 'New Lesson' },
      quiz: { title: 'New Quiz' },
      assignment: { title: 'New Assignment' },
      resource: { title: 'New Resource' }
    };

    const newContent: ContentBlock = {
      id: `content-${Date.now()}`,
      type,
      title: contentTypes[type].title,
      description: '',
      duration: type === 'video' ? 0 : undefined,
      content: { hidden: false }
    };

    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          contents: [...module.contents, newContent],
          isExpanded: true
        };
      }
      return module;
    }));

    setActiveContentId(newContent.id);
  };

  // Update module title
  const updateModuleTitle = (moduleId: string, title: string) => {
    setModules(modules.map(module => 
      module.id === moduleId ? { ...module, title } : module
    ));
  };

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { ...module, isExpanded: !module.isExpanded } 
        : module
    ));
  };

  // Update content details
  const updateContent = (moduleId: string, contentId: string, updates: Partial<ContentBlock>) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          contents: module.contents.map(content =>
            content.id === contentId ? { ...content, ...updates } : content
          )
        };
      }
      return module;
    }));
  };

  // Delete a module
  const deleteModule = (moduleId: string) => {
    setModules(modules.filter(module => module.id !== moduleId));
    if (activeModuleId === moduleId) {
      setActiveModuleId(modules.length > 1 ? modules[0].id : null);
    }
  };

  // Delete content from a module
  const deleteContent = (moduleId: string, contentId: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          contents: module.contents.filter(content => content.id !== contentId)
        };
      }
      return module;
    }));
    if (activeContentId === contentId) {
      setActiveContentId(null);
    }
  };

  // Calculate total course duration
  const totalDuration = modules.reduce((total, module) => {
    const moduleDuration = module.contents.reduce((sum, content) => 
      sum + (content.duration || 0), 0);
    return total + moduleDuration;
  }, 0);

  // Get active content
  const activeContent = (() => {
    if (!activeModuleId || !activeContentId) return null;
    const module = modules.find(m => m.id === activeModuleId);
    return module?.contents.find(c => c.id === activeContentId) || null;
  })();

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 min-w-0">
      {/* Left sidebar - Course outline */}
      <div className="w-1/3 border-r bg-white overflow-hidden flex flex-col min-w-0">
        <div className="p-4 border-b">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold border-0 shadow-none p-0 mb-2 focus-visible:ring-0 break-words"
            placeholder="Course Title"
          />
          <div className="flex items-center text-sm text-gray-500 break-words min-w-0">
            <span>{modules.length} modules • {modules.reduce((acc, mod) => acc + mod.contents.length, 0)} items • {totalDuration} min</span>
          </div>
        </div>
        
        <ScrollArea className="flex-1 min-w-0">
          <div className="p-4 space-y-4">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                isActive={activeModuleId === module.id}
                onModuleClick={() => setActiveModuleId(module.id)}
                onToggleExpand={() => toggleModule(module.id)}
                onUpdateTitle={(title) => updateModuleTitle(module.id, title)}
                onDelete={() => deleteModule(module.id)}
                onAddContent={addContent}
                activeContentId={activeContentId}
                onContentClick={(contentId) => setActiveContentId(contentId)}
                onDeleteContent={deleteContent}
              />
            ))}
            
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={addModule}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Module
            </Button>
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <Button className="w-full" size="lg">
            Save Course
          </Button>
        </div>
      </div>
      
      {/* Main content area - Content editor */}
      <div className="flex-1 overflow-auto p-6 min-w-0">
        {activeContent ? (
          <ContentEditor 
            module={modules.find(m => m.id === activeModuleId)!}
            content={activeContent}
            onUpdate={(updates) => updateContent(activeModuleId!, activeContentId!, updates)}
            onDelete={() => deleteContent(activeModuleId!, activeContentId!)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 min-w-0">
            <div className="text-center max-w-md">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-1 break-words">No content selected</h3>
              <p className="text-sm break-words">Select an item from the course outline or create a new one to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Module Card Component
const ModuleCard = ({
  module,
  isActive,
  onModuleClick,
  onToggleExpand,
  onUpdateTitle,
  onDelete,
  onAddContent,
  activeContentId,
  onContentClick,
  onDeleteContent,
}: {
  module: Module;
  isActive: boolean;
  onModuleClick: () => void;
  onToggleExpand: () => void;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
  onAddContent: (moduleId: string, type: ContentType) => void;
  activeContentId: string | null;
  onContentClick: (contentId: string) => void;
  onDeleteContent: (moduleId: string, contentId: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(module.title);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    onUpdateTitle(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onUpdateTitle(title);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setTitle(module.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
    >
      <div
        className={`flex items-center justify-between p-3 cursor-pointer ${
          isActive ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={onModuleClick}
      >
        <div className="flex items-center flex-1 min-w-0">
          <button
            className="p-1 mr-2 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
          >
            {module.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          
          {isEditing ? (
            <Input
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="h-8 text-sm px-2 py-1 break-words"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className="font-medium text-sm flex-1 text-left break-words min-w-0"
              onDoubleClick={() => setIsEditing(true)}
            >
              {module.title}
            </h3>
          )}
        </div>
        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-xs text-gray-500">
            {module.contents.length} {module.contents.length === 1 ? 'item' : 'items'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {module.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {module.contents.map((content) => (
                <ContentItem
                  key={content.id}
                  content={content}
                  isActive={activeContentId === content.id}
                  onClick={() => onContentClick(content.id)}
                  onDelete={() => onDeleteContent(module.id, content.id)}
                />
              ))}
              
              <div className="mt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8 w-full">
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Content
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem onClick={() => onAddContent(module.id, 'video')}>
                      <Video className="h-4 w-4 mr-2 text-blue-500" /> Video
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddContent(module.id, 'text')}>
                      <FileText className="h-4 w-4 mr-2 text-green-500" /> Lesson
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddContent(module.id, 'quiz')}>
                      <FileQuestion className="h-4 w-4 mr-2 text-purple-500" /> Quiz
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddContent(module.id, 'assignment')}>
                      <Code className="h-4 w-4 mr-2 text-yellow-500" /> Assignment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddContent(module.id, 'resource')}>
                      <FileText className="h-4 w-4 mr-2 text-gray-500" /> Resource
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Content Item Component
const ContentItem = ({
  content,
  isActive,
  onClick,
  onDelete,
}: {
  content: ContentBlock;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) => {
  const contentIcons = {
    video: <Video className="h-3.5 w-3.5 text-blue-500" />,
    text: <FileText className="h-3.5 w-3.5 text-green-500" />,
    quiz: <FileQuestion className="h-3.5 w-3.5 text-purple-500" />,
    assignment: <Code className="h-3.5 w-3.5 text-yellow-500" />,
    resource: <FileText className="h-3.5 w-3.5 text-gray-500" />,
  };

  return (
    <div
      className={`flex items-center p-2 rounded-md text-sm cursor-pointer transition-colors ${
        isActive
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50 border border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center flex-1 min-w-0">
        <div className="mr-2">
          {contentIcons[content.type] || contentIcons.text}
        </div>
        <span className="truncate">{content.title}</span>
      </div>
      <div className="flex items-center space-x-2 min-w-0">
        {content.duration ? (
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {content.duration} min
          </span>
        ) : null}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Content Editor Component
const ContentEditor = ({
  module,
  content,
  onUpdate,
  onDelete,
}: {
  module: Module;
  content: ContentBlock;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onDelete: () => void;
}) => {
  const [title, setTitle] = useState(content.title);
  const [description, setDescription] = useState(content.description || '');

  // Update parent when local state changes
  useEffect(() => {
    const updates: Partial<ContentBlock> = {};
    if (title !== content.title) updates.title = title;
    if (description !== content.description) updates.description = description;
    
    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
  }, [title, description, content, onUpdate]);

  // Update local state when content prop changes
  useEffect(() => {
    setTitle(content.title);
    setDescription(content.description || '');
  }, [content]);

  const contentIcons = {
    video: <Video className="h-5 w-5 text-blue-500" />,
    text: <FileText className="h-5 w-5 text-green-500" />,
    quiz: <FileQuestion className="h-5 w-5 text-purple-500" />,
    assignment: <Code className="h-5 w-5 text-yellow-500" />,
    resource: <FileText className="h-5 w-5 text-gray-500" />,
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between min-w-0">
        <div>
          <h2 className="text-2xl font-bold break-words">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold border-0 shadow-none p-0 focus-visible:ring-0 break-words"
              placeholder="Content Title"
            />
          </h2>
          <p className="text-sm text-gray-500 mt-1 break-words">
            Module: {module.title} • {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
          </p>
        </div>
        <div className="flex space-x-2 min-w-0">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" /> Preview
          </Button>
          <Button size="sm">
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this content..."
              rows={3}
            />
          </div>
          
          <div className="bg-white p-4 rounded-lg border overflow-hidden">
            <h3 className="font-medium mb-4 break-words">Content</h3>
            {content.type === 'video' && (
              <div className="space-y-4">
                <div>
                  <Label>Video URL</Label>
                  <Input
                    value={content.content?.url || ''}
                    onChange={(e) => onUpdate({
                      content: { ...content.content, url: e.target.value }
                    })}
                    placeholder="https://example.com/video"
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={content.duration || ''}
                    onChange={(e) => onUpdate({
                      duration: parseInt(e.target.value) || 0
                    })}
                    min="0"
                  />
                </div>
              </div>
            )}
            
            {content.type === 'text' && (
              <div>
                <Label>Content</Label>
                <Textarea
                  value={content.content?.text || ''}
                  onChange={(e) => onUpdate({
                    content: { ...content.content, text: e.target.value }
                  })}
                  rows={10}
                  placeholder="Enter your lesson content here..."
                  className="min-h-[300px]"
                />
              </div>
            )}
            
            {!['video', 'text'].includes(content.type) && (
              <div className="text-center py-8 text-gray-400">
                <p>Editor for {content.type} coming soon</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium break-words">Content Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between min-w-0">
                  <Label htmlFor="content-visible">Visible to students</Label>
                  <Switch
                    id="content-visible"
                    checked={!content.content?.hidden}
                    onCheckedChange={(checked) => 
                      onUpdate({ content: { ...content.content, hidden: !checked } })
                    }
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {content.content?.hidden 
                    ? 'This content is hidden from students.' 
                    : 'This content is visible to students.'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Content Type</Label>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md min-w-0 flex-shrink-0">
                  {contentIcons[content.type]}
                  <span className="text-sm font-medium break-words">
                    {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
                  </span>
                </div>
              </div>
              
              <div>
                <Label>Completion Time</Label>
                <div className="mt-1 flex rounded-md shadow-sm min-w-0">
                  <Input
                    type="number"
                    value={content.duration || ''}
                    onChange={(e) => onUpdate({
                      duration: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    className="rounded-r-none"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm break-words min-w-0">
                    minutes
                  </span>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" 
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Content
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium break-words">Prerequisites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-2 break-words">
                  Select modules or content that students must complete before accessing this content.
                </p>
                <div className="space-y-2">
                  {module.contents
                    .filter(c => c.id !== content.id)
                    .map(item => (
                      <div key={item.id} className="flex items-center space-x-2 min-w-0">
                        <input
                          type="checkbox"
                          id={`prereq-${item.id}`}
                          checked={content.content?.prerequisites?.includes(item.id) || false}
                          onChange={(e) => {
                            const prereqs = new Set(content.content?.prerequisites || []);
                            if (e.target.checked) {
                              prereqs.add(item.id);
                            } else {
                              prereqs.delete(item.id);
                            }
                            onUpdate({
                              content: { 
                                ...content.content, 
                                prerequisites: Array.from(prereqs) 
                              }
                            });
                          }}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`prereq-${item.id}`} 
                          className="text-sm text-gray-700 flex items-center break-words min-w-0"
                        >
                          {item.title}
                        </label>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
