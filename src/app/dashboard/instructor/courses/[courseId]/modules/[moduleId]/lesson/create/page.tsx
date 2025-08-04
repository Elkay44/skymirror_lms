'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// Import error handling utilities
import { getErrorMessage } from '@/lib/utils/error-handling';
import { ArrowLeft, Save, FileText, Video, Clock, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// For markdown editing
import { MarkdownEditor } from '@/components/editor/markdown-editor';

export default function CreateLessonPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('markdown');
  
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    duration: 0
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLessonData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle markdown editor changes
  const handleMarkdownChange = (value: string) => {
    setLessonData(prev => ({
      ...prev,
      content: value
    }));
  };

  // Handle duration change with validation
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setLessonData(prev => ({
      ...prev,
      duration: value < 0 ? 0 : value
    }));
  };

  // Create the lesson
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lessonData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Combine content based on the active tab
      let finalContent = lessonData.content;
      
      if (activeTab === 'video' && lessonData.videoUrl) {
        // Add video embed marker to the markdown content
        finalContent += `\n\n<!-- video:${lessonData.videoUrl} -->\n`;
      }
      
      await axios.post(
        `/api/courses/${courseId}/modules/${moduleId}/lessons`,
        {
          ...lessonData,
          content: finalContent,
          duration: parseInt(String(lessonData.duration)) || 0,
          isPublished: false
        }
      );
      toast.success('Lesson created successfully');
      
      // Redirect back to module page
      router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`);
      router.refresh();
    } catch (error: unknown) {
      console.error('Error creating lesson:', error);
      const errorMessage = `Failed to create lesson: ${getErrorMessage(error)}`;
      console.error('Error details:', { error });
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center gap-2 mb-6 min-w-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="h-8 gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Module
        </Button>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold break-words">Create New Lesson</h1>
        <p className="text-gray-500 mt-1">
          Add lesson content for your students. You can use markdown, embed videos, and more.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:gap-6">
          {/* Lesson Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Lesson Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter lesson title"
              value={lessonData.title}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          
          {/* Lesson Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Briefly describe what students will learn in this lesson"
              rows={3}
              value={lessonData.description}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          
          {/* Lesson Duration */}
          <div className="grid gap-2">
            <Label htmlFor="duration" className="flex items-center gap-2 min-w-0">
              <Clock className="h-4 w-4" /> 
              Estimated Duration (minutes)
            </Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              min="0"
              placeholder="0"
              value={lessonData.duration.toString()}
              onChange={handleDurationChange}
              disabled={isLoading}
              className="w-32"
            />
          </div>
          
          <Separator className="my-2" />
          
          {/* Content Editor Tabs */}
          <div>
            <Label className="mb-2 block">Lesson Content</Label>
            <Tabs 
              defaultValue="markdown" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="markdown" className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4" /> Markdown & Text
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2 min-w-0">
                  <Video className="h-4 w-4" /> Video
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="markdown" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Markdown supported</AlertTitle>
                  <AlertDescription>
                    You can use Markdown formatting for rich text content.
                  </AlertDescription>
                </Alert>
                
                <Card>
                  <CardContent className="pt-6">
                    <MarkdownEditor
                      value={lessonData.content}
                      onChange={handleMarkdownChange}
                      placeholder="Start typing your content here..."
                      minHeight={300}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="video" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Embed videos</AlertTitle>
                  <AlertDescription>
                    Add a YouTube, Vimeo, or other video URL to embed in the lesson.
                  </AlertDescription>
                </Alert>
                
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium break-words">Add Video</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="videoUrl">Video URL</Label>
                        <Input
                          id="videoUrl"
                          name="videoUrl"
                          placeholder="https://youtube.com/watch?v=..."
                          value={lessonData.videoUrl}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <p className="text-sm text-gray-500 break-words">
                          Supports YouTube, Vimeo, and other embed-friendly video platforms
                        </p>
                      </div>
                      
                      {lessonData.videoUrl && (
                        <div className="aspect-video bg-black/5 rounded-lg flex items-center justify-center min-w-0">
                          <p className="text-sm text-gray-500 break-words">
                            Video preview will be available after saving
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="flex justify-end gap-2 mt-6 min-w-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !lessonData.title.trim()}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Creating..." : "Save Lesson"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
