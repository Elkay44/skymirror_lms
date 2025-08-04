'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon, Plus, Trash2, Edit } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LearningGoal {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  progress: number;
  targetCompletion: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function LearningGoalsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();

  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [targetCompletion, setTargetCompletion] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (session) {
      fetchGoals();
    }
  }, [session]);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/learning-goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalData = {
      title,
      description: description || null,
      deadline: deadline?.toISOString(),
      targetCompletion: targetCompletion || null,
      progress: progress || 0,
    };

    try {
      const url = editingGoal 
        ? `/api/learning-goals/${editingGoal.id}`
        : '/api/learning-goals';
      
      const method = editingGoal ? 'PATCH' : 'POST';
      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goalData),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(error.error || 'Failed to save goal');
        }

        resetForm();
        fetchGoals();
        setIsDialogOpen(false);
        toast({
          title: editingGoal ? 'Goal Updated' : 'Goal Added',
          description: 'Your goal has been successfully saved.',
        });
      } catch (error) {
        console.error('Error saving goal:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to save goal',
          type: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        const response = await fetch(`/api/learning-goals/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchGoals();
          toast({
            title: 'Goal Deleted',
            description: 'Your goal has been successfully deleted.',
          });
        }
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete goal',
          type: 'destructive'
        });
      }
    }
  };

  const handleEdit = (goal: LearningGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setDeadline(goal.deadline ? new Date(goal.deadline) : undefined);
    setTargetCompletion(goal.targetCompletion || 0);
    setProgress(goal.progress);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setDeadline(undefined);
    setTargetCompletion(0);
    setProgress(0);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8 min-w-0">
        <div>
          <h1 className="text-2xl font-bold break-words">My Learning Goals</h1>
          <p className="text-gray-600">Set and track your learning objectives</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Goal
        </Button>
      </div>

      <div className="grid gap-4 lg:gap-6">
        {goals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">You don't have any learning goals yet.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start min-w-0">
                  <div>
                    <CardTitle className="text-lg break-words">{goal.title}</CardTitle>
                    {goal.description && (
                      <CardDescription className="mt-1">{goal.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(goal)}
                      className="h-6 w-6 lg:h-8 lg:w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(goal.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-500 mb-1 break-words min-w-0">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
                {goal.deadline && (
                  <div className="text-sm text-gray-500 flex items-center break-words min-w-0">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Due: {format(new Date(goal.deadline), 'MMM d, yyyy')}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDialogOpen(false);
          resetForm();
        } else {
          setIsDialogOpen(true);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
            <DialogDescription>
              {editingGoal 
                ? 'Update your learning goal details.'
                : 'Set a new learning goal to track your progress.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1 break-words">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Complete React Course"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1 break-words">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about your goal..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 break-words">Deadline</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      selected={deadline}
                      onSelect={(date) => setDeadline(date || undefined)}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label htmlFor="progress" className="block text-sm font-medium mb-1 break-words">
                  Progress: {progress}%
                </label>
                <Input
                  id="progress"
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
