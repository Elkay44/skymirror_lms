'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { ArrowLeft, MessageCircle, Tag, Info, Users, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function CreateForumPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  const [isLoading, setIsLoading] = useState(false);
  
  const [forumData, setForumData] = useState({
    title: '',
    description: '',
    isPublished: true,
    allowAnonymousPosts: false,
    requireApproval: false,
    tags: [] as string[],
    currentTag: ''
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForumData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle toggle changes
  const handleToggleChange = (name: string) => {
    setForumData(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }));
  };

  // Handle tag input
  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForumData(prev => ({
      ...prev,
      currentTag: e.target.value
    }));
  };

  // Add tag
  const addTag = () => {
    const tag = forumData.currentTag.trim();
    if (tag && !forumData.tags.includes(tag)) {
      setForumData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        currentTag: ''
      }));
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setForumData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Create the forum
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forumData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data for API
      const apiData = {
        title: forumData.title,
        description: forumData.description,
        isPublished: forumData.isPublished,
        allowAnonymousPosts: forumData.allowAnonymousPosts,
        requireApproval: forumData.requireApproval,
        tags: forumData.tags,
        isActive: true // Add required field for the backend
      };
      
      const response = await axios.post(
        `/api/courses/${courseId}/modules/${moduleId}/forums`,
        apiData
      );
      
      toast.success('Forum created successfully');
      
      // Redirect back to module page
      router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating forum:', error);
      toast.error('Failed to create forum');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Create Discussion Forum</h1>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">Forum Details</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter forum title"
                value={forumData.title}
                onChange={handleChange}
                className="max-w-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter a brief description of this discussion forum"
                value={forumData.description}
                onChange={handleChange}
                rows={3}
                className="max-w-2xl"
              />
              <p className="text-sm text-muted-foreground">
                Describe the purpose of this forum and guidelines for participation
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag size={16} />
                Forum Tags
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Add tags (press Enter)"
                  value={forumData.currentTag}
                  onChange={handleTagInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="max-w-[300px]"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addTag}
                >
                  Add
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {forumData.tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags added yet</p>
                ) : (
                  forumData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1 px-2 py-1">
                      {tag}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 rounded-full"
                        onClick={() => removeTag(tag)}
                      >
                        ✕
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center">
              <Settings className="mr-2 h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-medium">Forum Settings</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isPublished" className="cursor-pointer">Publish Forum</Label>
                  <p className="text-sm text-muted-foreground">Make visible to students immediately</p>
                </div>
                <Switch
                  id="isPublished"
                  checked={forumData.isPublished}
                  onCheckedChange={() => handleToggleChange('isPublished')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowAnonymousPosts" className="cursor-pointer">Allow Anonymous Posts</Label>
                  <p className="text-sm text-muted-foreground">Students can post without showing their identity</p>
                </div>
                <Switch
                  id="allowAnonymousPosts"
                  checked={forumData.allowAnonymousPosts}
                  onCheckedChange={() => handleToggleChange('allowAnonymousPosts')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireApproval" className="cursor-pointer">Require Post Approval</Label>
                  <p className="text-sm text-muted-foreground">New posts must be approved by instructor before appearing</p>
                </div>
                <Switch
                  id="requireApproval"
                  checked={forumData.requireApproval}
                  onCheckedChange={() => handleToggleChange('requireApproval')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? 'Creating...' : 'Create Forum'}
            {isLoading && <span className="animate-spin">⏳</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
