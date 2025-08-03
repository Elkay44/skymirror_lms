'use client';

import { GripVertical, Pencil, Trash2, FileText, Youtube, Video, FileCheck2, ListChecks, Code, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContentBlock } from '@/types/module';

interface BlockItemProps {
  block: ContentBlock;
  onEdit: () => void;
  onDelete: () => void;
  isReordering?: boolean;
  isSaving?: boolean;
  dragHandleProps?: any;
}

export function BlockItem({ block, onEdit, onDelete, isReordering = false, isSaving = false, dragHandleProps }: BlockItemProps) {
  const blockIcons = {
    text: <FileText className="h-4 w-4" />,
    video: <Video className="h-4 w-4" />,
    youtube: <Youtube className="h-4 w-4" />,
    assignment: <FileCheck2 className="h-4 w-4" />,
    project: <Code className="h-4 w-4" />,
    quiz: <ListChecks className="h-4 w-4" />
  };
  
  const blockColors = {
    text: 'border-l-blue-500',
    video: 'border-l-purple-500',
    youtube: 'border-l-red-500',
    assignment: 'border-l-amber-500',
    project: 'border-l-emerald-500',
    quiz: 'border-l-pink-500'
  };
  
  const blockBackgrounds = {
    text: 'bg-blue-50',
    video: 'bg-purple-50',
    youtube: 'bg-red-50',
    assignment: 'bg-amber-50',
    project: 'bg-emerald-50',
    quiz: 'bg-pink-50'
  };
  
  const statusColors = {
    'not-started': 'bg-gray-200 text-gray-700',
    'in-progress': 'bg-blue-200 text-blue-700',
    'completed': 'bg-green-200 text-green-700'
  };
  
  // Define valid project status types
  type ProjectStatus = 'not-started' | 'in-progress' | 'completed';
  
  // Get project status if applicable
  const projectStatus: ProjectStatus | null = block.type === 'project' ? 
    ((block as any).status as ProjectStatus || 'not-started') : null;

  const getBlockTitle = (block: ContentBlock): string => {
    switch (block.type) {
      case 'text':
        return block.content?.substring(0, 50) + (block.content?.length > 50 ? '...' : '') || 'Text Block';
      case 'video':
        return (block as any).title || 'Video';
      case 'youtube':
        return (block as any).caption || 'YouTube Video';
      case 'assignment':
        return (block as any).title || 'Assignment';
      case 'project':
        return (block as any).title || 'Project';
      case 'quiz':
        return (block as any).title || 'Quiz';
      default:
        return 'Block';
    }
  };

  return (
    <div 
      className={`group relative border-l-4 border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 ${blockColors[block.type]}`}
    >
      <div className={`${blockBackgrounds[block.type]}/10 px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          {isReordering && dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className={`h-8 w-8 flex items-center justify-center rounded-full ${blockBackgrounds[block.type]}`}>
            {blockIcons[block.type]}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {getBlockTitle(block)}
            </span>
            
            {/* Block specific details */}
            {block.type === 'project' && (
              <div className="flex items-center gap-2 mt-1">
                {projectStatus && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className={`${statusColors[projectStatus]} text-xs px-2 py-0`}>
                          {projectStatus.replace('-', ' ')}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Project Status</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {(block as any).dueDate && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date((block as any).dueDate).toLocaleDateString()}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Due Date</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {(block as any).templateUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          <span>Template</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Template Available</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEdit}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDelete}
            disabled={isSaving}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
      
      {/* Display description for projects if available */}
      {block.type === 'project' && (block as any).description && (
        <div className="px-4 py-2 text-sm text-muted-foreground border-t bg-background">
          {(block as any).description.substring(0, 100)}{(block as any).description.length > 100 ? '...' : ''}
        </div>
      )}
    </div>
  );
}
