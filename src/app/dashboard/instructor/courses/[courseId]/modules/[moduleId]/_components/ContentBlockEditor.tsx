'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Trash } from 'lucide-react';

// Import UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


// Import types and API
import { ContentBlock as ModuleContentBlock, ContentBlockType, UpdateContentBlockRequest } from '@/types/module';

// Define Question type locally if it's not exported from module types
interface Question {
  id?: string;
  text: string;
  options: { text: string; isCorrect: boolean }[];
  type: 'multiple-choice' | 'single-choice' | 'true-false';
}
import { createContentBlock, updateContentBlock } from "@/lib/api/module-pages";

// Define our local ContentBlock schema types
// We're defining local interfaces to handle form data conversion
interface LocalContentBlock {
  id?: string;
  moduleId?: string;
  pageId?: string;
  type: ContentBlockType;
  order: number;
  title?: string;
  description?: string;
}

interface TextBlock extends LocalContentBlock {
  type: 'text';
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VideoBlock extends LocalContentBlock {
  type: 'video';
  videoUrl: string;
  duration: number;
  isDownloadable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface YouTubeBlock extends LocalContentBlock {
  type: 'youtube';
  videoId: string;
  showControls?: boolean;
  startTime?: number;
  endTime?: number;
  caption?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AssignmentBlock extends LocalContentBlock {
  type: 'assignment';
  instructions: string;
  points: number;
  submissionType: 'text' | 'file' | 'link';
  dueDate?: Date;
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectBlock extends LocalContentBlock {
  type: 'project';
  requirements: string[];
  resources?: { title: string; url: string; type: 'link' | 'file' | 'video' }[];
  status: 'not-started' | 'in-progress' | 'completed';
  templateUrl?: string;
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuizBlock extends LocalContentBlock {
  type: 'quiz';
  questions?: Question[];
  passingScore: number;
  timeLimit?: number;
  showResults: boolean;
  allowRetake: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define form data types for each content block type
interface BlockFormBase {
  type: ContentBlockType;
  order: number;
  title: string;
  description?: string;
}

interface TextBlockFormData extends BlockFormBase {
  type: 'text';
  content: string;
}

interface VideoBlockFormData extends BlockFormBase {
  type: 'video';
  videoUrl: string;
  duration: number;
  isDownloadable: boolean;
}

interface YouTubeBlockFormData extends BlockFormBase {
  type: 'youtube';
  videoId: string;
  showControls?: boolean;
  startTime?: number;
  endTime?: number;
  caption?: string;
}

interface AssignmentBlockFormData extends BlockFormBase {
  type: 'assignment';
  instructions: string;
  points: number;
  submissionType: 'text' | 'file' | 'link';
  dueDate?: string;
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
}

interface ProjectBlockFormData extends BlockFormBase {
  type: 'project';
  templateUrl?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  requirements: string[];
  resources?: { title: string; url: string; type: 'link' | 'file' | 'video' }[];
  dueDate?: string;
}

interface QuizBlockFormData extends BlockFormBase {
  type: 'quiz';
  passingScore: number;
  timeLimit?: number;
  showResults: boolean;
  allowRetake: boolean;
}

// Combined type for all content block form data
type ContentBlockFormData = 
  | TextBlockFormData
  | VideoBlockFormData
  | YouTubeBlockFormData
  | AssignmentBlockFormData
  | ProjectBlockFormData
  | QuizBlockFormData;

// Define form validation schema for each content block type
const textBlockSchema = z.object({
  type: z.literal('text'),
  order: z.number(),
  title: z.string().nonempty('Title is required'),
  description: z.string().optional().nullable(),
  content: z.string().nonempty('Content is required'),
});

const videoBlockSchema = z.object({
  type: z.literal('video'),
  order: z.number(),
  title: z.string().nonempty('Title is required'),
  description: z.string().optional().nullable(),
  videoUrl: z.string().nonempty('Video URL is required').url('Invalid URL'),
  duration: z.number().optional(),
  isDownloadable: z.boolean().optional(),
});

const youtubeBlockSchema = z.object({
  type: z.literal('youtube'),
  order: z.number(),
  title: z.string().nonempty('Title is required'),
  description: z.string().optional().nullable(),
  videoId: z.string().nonempty('Video ID is required'),
  showControls: z.boolean().optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  caption: z.string().optional(),
});

const assignmentBlockSchema = z.object({
  type: z.literal('assignment'),
  order: z.number(),
  title: z.string().nonempty('Title is required'),
  description: z.string().optional().nullable(),
  instructions: z.string().nonempty('Instructions are required'),
  points: z.number().min(0, 'Points must be at least 0'),
  submissionType: z.enum(['text', 'file', 'link']),
  dueDate: z.string().optional().nullable(),
  allowedFileTypes: z.array(z.string()).optional(),
  maxFileSizeMB: z.number().optional(),
});

const projectBlockSchema = z.object({
  type: z.literal('project'),
  order: z.number(),
  title: z.string().nonempty('Title is required'),
  description: z.string().optional().nullable(),
  templateUrl: z.string().optional().nullable(),
  status: z.enum(['not-started', 'in-progress', 'completed'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).default('not-started'),
  requirements: z.array(z.string()).nonempty('At least one requirement is needed'),
  resources: z.array(
    z.object({
      title: z.string().min(1, 'Resource title is required'),
      url: z.string().url('Invalid resource URL'),
      type: z.enum(['link', 'file', 'video'], {
        errorMap: () => ({ message: 'Invalid resource type' }),
      }),
    })
  ).optional(),
  dueDate: z.string().optional(),
});

const quizBlockSchema = z.object({
  type: z.literal('quiz'),
  order: z.number(),
  title: z.string().nonempty('Title is required'),
  description: z.string().optional().nullable(),
  passingScore: z.number().min(0).max(100, 'Passing score must be between 0 and 100'),
  timeLimit: z.number().optional(),
  showResults: z.boolean(),
  allowRetake: z.boolean(),
});

// Union of all block schemas
const blockFormSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  videoBlockSchema,
  youtubeBlockSchema,
  assignmentBlockSchema,
  projectBlockSchema,
  quizBlockSchema,
]);

// Helper function to format date to string in YYYY-MM-DD format
const dateToString = (date?: Date | string | null): string | undefined => {
  if (!date) return undefined;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

// Component props
interface ContentBlockFormProps {
  courseId: string;
  moduleId: string;
  pageId: string;
  block?: ModuleContentBlock;
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: ModuleContentBlock) => void;
  selectedType?: ContentBlockType;
}

export const ContentBlockEditor = ({
  courseId,
  moduleId,
  pageId,
  block,
  isOpen,
  onClose,
  onSave,
  selectedType = 'text'
}: ContentBlockFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeType, setActiveType] = useState<ContentBlockType>(selectedType);
  const isEditMode = !!block;
  
  // Set up form with zod resolver
  const form = useForm<ContentBlockFormData>({
    resolver: zodResolver(blockFormSchema) as any,
    defaultValues: block ? (() => {
      const baseData = {
        type: block.type as ContentBlockType,
        order: block.order,
        title: (block as any).title || '',
        description: (block as any).description || ''
      };
      
      let specificData = {};
      
      if (block.type === 'text') {
        const textBlock = block as TextBlock;
        specificData = {
          content: textBlock.content || ''
        };
      } else if (block.type === 'video') {
        const videoBlock = block as VideoBlock;
        specificData = {
          videoUrl: videoBlock.videoUrl || '',
          duration: videoBlock.duration || 0,
          isDownloadable: !!videoBlock.isDownloadable
        };
      } else if (block.type === 'youtube') {
        const youtubeBlock = block as YouTubeBlock;
        specificData = {
          videoId: youtubeBlock.videoId || '',
          showControls: youtubeBlock.showControls ?? true,
          startTime: youtubeBlock.startTime || 0,
          endTime: youtubeBlock.endTime || 0
        };
      } else if (block.type === 'assignment') {
        const assignmentBlock = block as AssignmentBlock;
        specificData = {
          instructions: assignmentBlock.instructions || '',
          points: assignmentBlock.points || 0,
          submissionType: assignmentBlock.submissionType || 'text',
          dueDate: assignmentBlock.dueDate ? dateToString(assignmentBlock.dueDate) : undefined,
          allowedFileTypes: assignmentBlock.allowedFileTypes || [],
          maxFileSizeMB: assignmentBlock.maxFileSizeMB || 0
        };
      } else if (block.type === 'project') {
        const projectBlock = block as ProjectBlock;
        specificData = {
          templateUrl: projectBlock.templateUrl || '',
          status: projectBlock.status || 'not-started',
          requirements: projectBlock.requirements || [''],
          resources: projectBlock.resources || [],
          dueDate: projectBlock.dueDate ? dateToString(projectBlock.dueDate) : undefined
        };
      } else if (block.type === 'quiz') {
        const quizBlock = block as unknown as QuizBlock;
        specificData = {
          passingScore: quizBlock.passingScore || 70,
          timeLimit: quizBlock.timeLimit,
          showResults: !!quizBlock.showResults,
          allowRetake: !!quizBlock.allowRetake
        };
      }
      
      return {
        ...baseData,
        ...specificData
      } as ContentBlockFormData;
    })() : {
      type: 'text' as const,
      order: 0,
      title: '',
      description: '',
      content: ''
    }
  });
  
  // Observe type changes and update the form
  useEffect(() => {
    if (activeType !== form.getValues('type')) {
      form.setValue('type', activeType);
    }
  }, [activeType, form]);

  // Set active type based on block or selectedType
  useEffect(() => {
    if (block) {
      setActiveType(block.type as ContentBlockType);
    } else if (selectedType) {
      setActiveType(selectedType);
    }
  }, [block, selectedType]);

  // Handle form submission
  const handleSubmit: SubmitHandler<ContentBlockFormData> = async (data) => {
    setIsSubmitting(true);
    
    try {
      let blockData: ModuleContentBlock;
      switch (data.type) {
        case 'text':
          blockData = {
            id: block?.id,
            moduleId: moduleId,
            pageId: pageId,
            type: 'text',
            order: data.order,
            title: data.title || '',
            description: data.description || '',
            content: (data as TextBlockFormData).content || '',
            createdAt: block?.createdAt ? new Date(block.createdAt as Date) : new Date(),
            updatedAt: new Date(),
          } as unknown as ModuleContentBlock;
          break;
        case 'video':
          blockData = {
            id: block?.id,
            moduleId: moduleId,
            pageId: pageId,
            type: 'video',
            order: data.order,
            title: data.title || '',
            description: data.description || '',
            videoUrl: (data as VideoBlockFormData).videoUrl || '',
            duration: (data as VideoBlockFormData).duration || 0,
            isDownloadable: (data as VideoBlockFormData).isDownloadable || false,
            createdAt: block?.createdAt ? new Date(block.createdAt) : new Date(),
            updatedAt: new Date(),
          } as unknown as ModuleContentBlock;
          break;
        case 'youtube':
          blockData = {
            id: block?.id,
            moduleId: moduleId,
            pageId: pageId,
            type: 'youtube',
            order: data.order,
            title: data.title || '',
            description: data.description || '',
            videoId: data.videoId || '',
            startTime: (data as any).startTime || 0,
            endTime: (data as any).endTime || 0,
            showControls: (data as any).showControls || true,
            createdAt: block?.createdAt ? new Date(block.createdAt) : new Date(),
            updatedAt: new Date(),
          } as unknown as ModuleContentBlock;
          break;
        case 'assignment':
          blockData = {
            id: block?.id,
            moduleId: moduleId,
            pageId: pageId,
            type: 'assignment',
            order: data.order,
            title: data.title || '',
            description: data.description || '',
            instructions: (data as AssignmentBlockFormData).instructions || '',
            points: (data as AssignmentBlockFormData).points || 0,
            submissionType: (data as AssignmentBlockFormData).submissionType || 'text',
            dueDate: (data as AssignmentBlockFormData).dueDate ? new Date((data as AssignmentBlockFormData).dueDate as string) : undefined,
            allowedFileTypes: (data as any).allowedFileTypes || [],
            maxFileSizeMB: (data as any).maxFileSizeMB || 0,
            createdAt: block?.createdAt ? new Date(block.createdAt) : new Date(),
            updatedAt: new Date(),
          } as unknown as ModuleContentBlock;
          break;
        case 'project':
          blockData = {
            id: block?.id,
            moduleId: moduleId,
            pageId: pageId,
            type: 'project',
            order: data.order,
            title: data.title || '',
            description: data.description || '',
            requirements: (data as ProjectBlockFormData).requirements || [],
            resources: (data as ProjectBlockFormData).resources || [],
            templateUrl: (data as ProjectBlockFormData).templateUrl || '',
            status: (data as ProjectBlockFormData).status || 'not-started',
            dueDate: (data as ProjectBlockFormData).dueDate ? new Date((data as ProjectBlockFormData).dueDate as string) : undefined,
            createdAt: block?.createdAt ? new Date(block.createdAt) : new Date(),
            updatedAt: new Date(),
          } as unknown as ModuleContentBlock;
          break;
        case 'quiz':
          blockData = {
            id: block?.id,
            moduleId: moduleId,
            pageId: pageId,
            type: 'quiz',
            order: data.order,
            title: data.title || '',
            description: data.description || '',
            timeLimit: (data as QuizBlockFormData).timeLimit || 0,
            passingScore: (data as QuizBlockFormData).passingScore || 0,
            showResults: (data as QuizBlockFormData).showResults || false,
            allowRetake: (data as QuizBlockFormData).allowRetake || false,
            questions: [], // Empty array as a placeholder
            createdAt: block?.createdAt ? new Date(block.createdAt) : new Date(),
            updatedAt: new Date(),
          } as unknown as ModuleContentBlock;
          break;
        default:
          throw new Error(`Unsupported block type: ${(data as any).type}`);
      }
      
      if (isEditMode && block?.id) {
        // Update existing block
        const updateRequest: UpdateContentBlockRequest = {
          id: block.id,
          data: blockData
        };
        await updateContentBlock(courseId, moduleId, pageId, block.id, updateRequest);
        toast.success('Content block updated successfully!');
      } else {
        // Create new block
        const newBlockData = await createContentBlock(courseId, moduleId, pageId, blockData);
        blockData = newBlockData as ModuleContentBlock;
        toast.success('Content block created successfully!');
      }
      
      // Call onSave with the updated or new block data
      onSave(blockData);
      onClose();
    } catch (error) {
      console.error('Error saving content block:', error);
      toast.error('Failed to save content block');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const onSubmit: SubmitHandler<ContentBlockFormData> = (data) => {
    handleSubmit(data);
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
    <DialogContent>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* ... */}
        
        {activeType === 'project' && (
          <div className="space-y-4 mb-6">
            {/* Project Status */}
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={field.value || 'not-started'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            
            {/* Project Requirements */}
            <div>
              <Label>Requirements</Label>
              <div className="space-y-2 mt-2">
                {(form.watch('requirements') || []).map((_, index) => (
                  <div key={index} className="flex gap-2 min-w-0">
                    <Input
                      placeholder={`Requirement ${index + 1}`}
                      {...form.register(`requirements.${index}`)}
                      className="flex-1 min-w-0"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const requirements = form.getValues('requirements');
                        if (requirements.length > 1) {
                          form.setValue(
                            'requirements',
                            requirements.filter((_, i) => i !== index)
                          );
                        }
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue('requirements', [
                      ...(form.getValues('requirements') || []),
                      ''
                    ]);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Requirement
                </Button>
              </div>
            </div>
            
            {/* Project Template URL */}
            <div>
              <Label>Template URL</Label>
              <Input
                {...form.register('templateUrl')}
                placeholder="Template URL"
              />
            </div>
            
            {/* Project Due Date */}
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                {...form.register('dueDate')}
                placeholder="Due Date"
              />
            </div>
          </div>
        )}
        
        {activeType === 'quiz' && (
          <div className="space-y-4 mb-6">
            {/* Quiz Passing Score */}
            <div>
              <Label>Passing Score</Label>
              <Input
                type="number"
                min="0"
                max="100"
                {...(form.register as any)('passingScore', { valueAsNumber: true })}
                placeholder="Passing Score"
              />
            </div>
            
            {/* Quiz Time Limit */}
            <div>
              <Label>Time Limit (minutes, optional)</Label>
              <Input
                type="number"
                min="0"
                {...(form.register as any)('timeLimit', { valueAsNumber: true })}
                placeholder="Time Limit"
              />
            </div>
            
            {/* Quiz Show Results */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <Checkbox
                  id="showResults"
                  {...(form.register as any)('showResults')}
                />
                <Label htmlFor="showResults" className="cursor-pointer">Show results after submission</Label>
              </div>
              
              {/* Quiz Allow Retake */}
              <div className="flex items-center gap-2 min-w-0">
                <Checkbox
                  id="allowRetake"
                  {...(form.register as any)('allowRetake')}
                />
                <Label htmlFor="allowRetake" className="cursor-pointer">Allow retakes</Label>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditMode ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
  );
};
