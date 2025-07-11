'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, UseFormReturn, FieldValues, UseFieldArrayReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Plus, X, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'; // Using path alias for consistency
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Module, ModuleStatus, CreateModuleRequest, UpdateModuleRequest } from '@/types/module';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const moduleFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  learningObjectives: z.array(z.object({
    id: z.string().optional(),
    text: z.string().min(1, 'Objective cannot be empty')
  })).default([]),
  prerequisites: z.array(z.string()).default([]),
  duration: z.number().min(1, 'Duration is required'),
  isPublished: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  estimatedDuration: z.number().min(1, 'Estimated duration is required')
});

export type ModuleFormValues = z.infer<typeof moduleFormSchema>;

interface ModuleFormProps {
  module?: Module;
  courseId: string;
  modules: Module[];
  open: boolean;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
  createModule: (data: CreateModuleRequest) => Promise<void>;
  updateModule: (id: string, data: UpdateModuleRequest) => Promise<void>;
}

export function ModuleForm({
  module,
  courseId,
  modules,
  open,
  onSuccess,
  onOpenChange,
  createModule,
  updateModule,
}: ModuleFormProps) {
  // Using react-hot-toast directly
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newObjective, setNewObjective] = useState('');
  const [selectedPrerequisite, setSelectedPrerequisite] = useState('');

  const defaultValues: Partial<ModuleFormValues> = {
    title: module?.title || '',
    description: module?.description || '',
    learningObjectives: module?.learningObjectives || [],
    prerequisites: module?.prerequisites || [],
    duration: module?.duration || 30,
    isPublished: module?.isPublished || false,
    status: module?.status || 'draft',
    estimatedDuration: module?.estimatedDuration || 30,
  };

  type FormValues = z.infer<typeof moduleFormSchema>;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(moduleFormSchema) as any,
    defaultValues: {
      ...defaultValues,
      learningObjectives: defaultValues.learningObjectives?.map(lo => ({
        id: lo.id,
        text: lo.text
      })) || [],
      prerequisites: defaultValues.prerequisites || [],
      status: defaultValues.status || 'draft',
      isPublished: defaultValues.isPublished || false,
      duration: defaultValues.duration || 0,
      estimatedDuration: defaultValues.estimatedDuration || 0
    },
  });

  const { 
    fields: learningObjectiveFields, 
    append: appendObjective, 
    remove: removeObjective 
  } = useFieldArray<FormValues>({
    name: "learningObjectives",
    control: form.control,
  });

  // Using any to bypass TypeScript constraint as the prerequisites array is of string type, not object type
  const { 
    fields: prerequisiteFields, 
    append: appendPrerequisite, 
    remove: removePrerequisite 
  } = useFieldArray<any>({
    name: "prerequisites" as const,
    control: form.control as any,
  });

  useEffect(() => {
    if (onOpenChange) {
      form.reset(defaultValues);
      setNewObjective('');
    }
  }, [onOpenChange, module]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    setValue,
  } = form;

  const handleFormSubmit = handleSubmit(async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      if (module) {
        // Update existing module
        await updateModule(module.id, {
          title: values.title,
          description: values.description || '',
          status: values.status,
          learningObjectives: values.learningObjectives.map(lo => lo.text),
          prerequisites: values.prerequisites,
          estimatedDuration: values.estimatedDuration,
        });
        toast.success('Module updated successfully');
      } else {
        // Create new module
        await createModule({
          title: values.title,
          description: values.description || '',
          status: values.status,
          learningObjectives: values.learningObjectives.map(lo => lo.text),
          prerequisites: values.prerequisites,
          estimatedDuration: values.estimatedDuration,
        });
        toast.success('Module created successfully');
      }
      
      onSuccess?.();
      onOpenChange?.(false);
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Failed to save module');
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleAddPrerequisite = (moduleId: string) => {
    if (moduleId && !form.getValues('prerequisites').includes(moduleId)) {
      appendPrerequisite(moduleId as any);
    }
  };

  const handleRemovePrerequisiteById = (moduleId: string) => {
    const currentPrerequisites = form.getValues('prerequisites');
    const index = currentPrerequisites.indexOf(moduleId);
    if (index !== -1) {
      removePrerequisite(index);
    }
  };

  const handleRemovePrerequisiteByIndex = (index: number) => {
    removePrerequisite(index);
  };

  const addObjective = () => {
    // Only add if there's text
    if (newObjective.trim()) {
      // Don't include an ID when creating a new objective
      appendObjective({ text: newObjective.trim(), id: undefined } as any);
      setNewObjective('');
    }
  };

  const handleModuleSelect = (moduleId: string) => {
    const renderPrerequisiteChips = () => {
      const prerequisites = form.watch('prerequisites') || [];
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {prerequisites.map((moduleId: string) => {
            const module = modules.find((m) => m.id === moduleId);
            if (!module) return null;
            return (
              <div
                key={moduleId}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full bg-muted"
              >
                {module.title}
                <button
                  type="button"
                  onClick={() => handleRemovePrerequisiteById(moduleId)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      );
    };

    handleAddPrerequisite(moduleId);
    setSelectedPrerequisite('');
    return renderPrerequisiteChips();
  };

  const availablePrerequisites = modules.filter(
    m => !module || m.id !== module.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{module ? 'Edit Module' : 'Create New Module'}</DialogTitle>
          <DialogDescription>
            {module
              ? 'Update the module details below.'
              : 'Fill in the details to create a new module.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Module Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Introduction to Course" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What will students learn in this module?"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedDuration"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Estimated Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="learningObjectives"
                render={() => (
                  <FormItem>
                    <FormLabel>Learning Objectives</FormLabel>
                    <div className="space-y-2">
                      {learningObjectiveFields.map((field: any, index: number) => {
                        const fieldName = `learningObjectives.${index}` as const;
                        return (
                          <div key={field.id} className="flex items-center gap-2">
                            <Input
                              {...form.register(fieldName)}
                              placeholder="Enter learning objective"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeObjective(index)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Add a learning objective"
                          value={newObjective}
                          onChange={(e) => setNewObjective(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addObjective();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={addObjective}
                          disabled={!newObjective.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <FormDescription>
                      What will students be able to do after completing this module?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {availablePrerequisites.length > 0 && (
                <FormField
                  control={form.control}
                  name="prerequisites"
                  render={() => (
                    <FormItem>
                      <FormLabel>Prerequisites</FormLabel>
                      <Select
                        onValueChange={(value: string) => {
                          const currentPrerequisites = form.getValues('prerequisites');
                          if (!currentPrerequisites.includes(value)) {
                            handleModuleSelect(value);
                          }
                        }}
                        value=""
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a module" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availablePrerequisites.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Render selected prerequisites */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {prerequisiteFields.map((field, index) => {
                          // Get the prerequisite ID from the form field
                          // Get the prerequisite value at the current index
                          const prereqId = form.getValues(`prerequisites.${index as number}`);
                          const prereqModule = modules.find(m => m.id === prereqId);
                          return prereqModule ? (
                            <div key={field.id} className="flex items-center gap-1 bg-muted rounded-md px-2 py-1">
                              <span>{prereqModule.title}</span>
                              <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0"
                              onClick={() => handleRemovePrerequisiteByIndex(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : null;
                        })}
                      </div>
                      
                      <FormDescription>
                        Select modules that students should complete before starting this one.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange && onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {module ? 'Updating...' : 'Creating...'}
                  </span>
                ) : module ? (
                  'Update Module'
                ) : (
                  'Create Module'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
