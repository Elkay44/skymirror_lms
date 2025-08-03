'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { ModulePage } from '@/types/module';
import { 
  getModulePages, 
  createModulePage, 
  updateModulePage, 
  deleteModulePage,
  reorderModulePages
} from '@/lib/api/module-pages';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

interface ModulePagesProps {
  courseId: string;
  moduleId: string;
  initialPages?: ModulePage[];
  onPageSelect?: (page: ModulePage) => void;
  onPagesChange?: (updatedPages: ModulePage[]) => void;
}

export function ModulePages({ courseId, moduleId, initialPages = [], onPageSelect, onPagesChange }: ModulePagesProps) {
  const router = useRouter();
  const [pages, setPages] = useState<ModulePage[]>(initialPages);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ModulePage | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

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

  useEffect(() => {
    const loadPages = async () => {
      try {
        setIsLoading(true);
        const data = await getModulePages(courseId, moduleId);
        setPages(data.data);
      } catch (error) {
        console.error('Failed to load pages:', error);
        toast.error('Failed to load pages');
      } finally {
        setIsLoading(false);
      }
    };

    loadPages();
  }, [courseId, moduleId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIsPublished(true);
    setEditingPage(null);
  };

  const handleOpenDialog = (page: ModulePage | null = null) => {
    if (page) {
      setTitle(page.title);
      setDescription(page.description || '');
      setIsPublished(page.isPublished);
      setEditingPage(page);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      if (editingPage) {
        const updatedPage = await updateModulePage(courseId, moduleId, editingPage.id, {
          title,
          description,
          isPublished,
        });
        
        const updatedPages = pages.map(p => p.id === updatedPage.id ? updatedPage : p);
        setPages(updatedPages);
        if (onPagesChange) onPagesChange(updatedPages);
        toast.success('Page updated successfully');
      } else {
        const newPage = await createModulePage(courseId, moduleId, {
          title,
          description,
          isPublished,
        });
        
        const updatedPages = [...pages, newPage];
        setPages(updatedPages);
        if (onPagesChange) onPagesChange(updatedPages);
        if (onPageSelect) onPageSelect(newPage);
        toast.success('Page created successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error(`Failed to ${editingPage ? 'update' : 'create'} page`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await deleteModulePage(courseId, moduleId, pageId);
      setPages(pages.filter(p => p.id !== pageId));
      toast.success('Page deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Failed to delete page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = pages.findIndex(p => p.id === active.id);
    const newIndex = pages.findIndex(p => p.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    const newPages = [...pages];
    const [movedPage] = newPages.splice(oldIndex, 1);
    newPages.splice(newIndex, 0, movedPage);
    
    setPages(newPages);
    
    // Update order in the database
    try {
      setIsSavingOrder(true);
      const updates = newPages.map((page, index) => ({
        id: page.id,
        order: index,
      }));
      
      await reorderModulePages(courseId, moduleId, { updates });
      router.refresh();
    } catch (error) {
      console.error('Error reordering pages:', error);
      toast.error('Failed to save page order');
      // Revert on error
      setPages([...pages]);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const toggleReordering = () => {
    setIsReordering(!isReordering);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Module Pages</h3>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleReordering}
            disabled={pages.length === 0}
          >
            {isReordering ? 'Done Reordering' : 'Reorder Pages'}
          </Button>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Page
          </Button>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No pages yet. Add your first page to get started.</p>
          <Button className="mt-4" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Page
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {isReordering ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-2">
                Drag and drop to reorder pages. Click "Done Reordering" when finished.
              </div>
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              >
                <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {pages.map((page) => (
                    <SortablePageItem 
                      key={page.id} 
                      page={page} 
                      isReordering={isReordering}
                      onEdit={() => handleOpenDialog(page)}
                      onDelete={() => handleDeletePage(page.id)}
                      isSavingOrder={isSavingOrder}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <div className="space-y-3 mt-3 overflow-y-auto max-h-[60vh]">
              {pages.map((page) => (
                <div
                  key={page.id} 
                  className="cursor-pointer" 
                  onClick={() => onPageSelect && onPageSelect(page)}
                >
                  <PageItem 
                    page={page}
                    onEdit={() => handleOpenDialog(page)} 
                    onDelete={() => handleDeletePage(page.id)}
                    isReordering={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Edit Page' : 'Create New Page'}</DialogTitle>
            <DialogDescription>
              {editingPage 
                ? 'Update the page details below.'
                : 'Add a new page to your module. You can add content to it later.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter page title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief description of this page"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublished"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="isPublished">
                  {isPublished ? 'Published' : 'Draft'}
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingPage ? 'Update Page' : 'Create Page'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PageItemProps {
  page: ModulePage;
  onEdit: () => void;
  onDelete: () => void;
  isReordering?: boolean;
  isSavingOrder?: boolean;
}

function PageItem({ page, onEdit, onDelete, isReordering = false, isSavingOrder = false }: PageItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4">
        {isReordering && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        <div>
          <h4 className="font-medium">
            {page.title}
            {!page.isPublished && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                Draft
              </span>
            )}
          </h4>
          {page.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {page.description}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onEdit}
          disabled={isSavingOrder}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDelete}
          disabled={isSavingOrder}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}

const SortablePageItem = ({ page, ...props }: PageItemProps) => {
  const {
    attributes,
    listeners: _listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <PageItem 
        page={page} 
        {...props} 
        isReordering={true}
        isSavingOrder={props.isSavingOrder}
      />
    </div>
  );
};
