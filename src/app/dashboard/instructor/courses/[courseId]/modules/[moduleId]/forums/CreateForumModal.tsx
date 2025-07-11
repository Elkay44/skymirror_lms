'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateForumModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  moduleId: string;
}

export function CreateForumModal({ isOpen, onClose, courseId, moduleId }: CreateForumModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.trim().length < 3) {
      toast({
        title: 'Validation Error',
        description: 'Forum title must be at least 3 characters long'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/forums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          isActive: true
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
      }
      
      toast({
        title: 'Success',
        description: 'Forum has been created successfully'
      });
      
      // Refresh the page to show the new forum
      router.refresh();
      
      // Close the modal
      onClose();
      
      // Navigate to the forum
      router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forums`);
      
    } catch (error) {
      console.error('Error creating forum:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create forum'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create Module Forum</DialogTitle>
          <DialogDescription>
            Create a discussion forum specifically for this module. Students can ask questions and discuss module content.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Forum Title
            </label>
            <Input
              id="title"
              placeholder="e.g., Module Discussion Forum"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              placeholder="Describe what this forum is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={4}
              className="w-full resize-none"
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Forum
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
