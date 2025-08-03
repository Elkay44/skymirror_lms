'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { ArrowLeft, Save, FileText, Video, Clock, PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// For rich text editing
import { BlockEditor, ContentBlock } from '@/components/editor/block-editor';

export default function CreatePagePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  
  const [pageData, setPageData] = useState({
    title: '',
    description: '',
    content: '',
    videoEmbed: '',
    duration: 0
  });

  // Content blocks for rich editing experience
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: 'initial', type: 'text', content: 'Start writing your content here...' }
  ]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPageData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle duration change with validation
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setPageData(prev => ({
      ...prev,
      duration: value < 0 ? 0 : value
    }));
  };



  // Create the page
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pageData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Combine content based on the active tab and blocks
      let finalContent = pageData.content;
      
      // If we're using the block editor, serialize the content blocks to JSON
      if (activeTab === 'content') {
        finalContent = JSON.stringify(contentBlocks);
      }
      
      // If video tab is active, include video information in the content
      if (activeTab === 'video' && pageData.videoEmbed) {
        finalContent += `\n\n<!-- video:${pageData.videoEmbed} -->\n`;
      }
      
      // For simplicity, we're using the lessons API endpoint but specifying this as a 'page' content type
      await axios.post(
        `/api/courses/${courseId}/modules/${moduleId}/lessons`,
        {
          ...pageData,
          content: finalContent,
          type: 'page' // This marks it as a page rather than a standard lesson
        }
      );
      
      toast.success('Page created successfully');
      
      // Redirect back to module page
      router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create page');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center gap-2 mb-6">
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
        <h1 className="text-3xl font-bold">Create New Page</h1>
        <p className="text-gray-500 mt-1">
          Create a rich content page with text, images, videos, and more.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          {/* Page Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Page Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter page title"
              value={pageData.title}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          
          {/* Page Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Briefly describe what this page contains"
              rows={3}
              value={pageData.description}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          
          {/* Page Duration */}
          <div className="grid gap-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> 
              Estimated Duration (minutes)
            </Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              min="0"
              placeholder="0"
              value={pageData.duration.toString()}
              onChange={handleDurationChange}
              disabled={isLoading}
              className="w-32"
            />
          </div>
          
          <Separator className="my-2" />
          
          {/* Content Editor Tabs */}
          <div>
            <Label className="mb-2 block">Page Content</Label>
            <Tabs 
              defaultValue="content" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Rich Content Editor
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="h-4 w-4" /> Video Embed
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <Alert>
                  <PlusCircle className="h-4 w-4" />
                  <AlertTitle>Rich Content Editor</AlertTitle>
                  <AlertDescription>
                    Add text, images, videos, code blocks, and more to create engaging content.
                  </AlertDescription>
                </Alert>
                
                <Card>
                  <CardContent className="pt-6 pb-2">
                    <BlockEditor
                      blocks={contentBlocks}
                      onChange={setContentBlocks}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="video" className="space-y-4">
                <Alert>
                  <Video className="h-4 w-4" />
                  <AlertTitle>Video Embed</AlertTitle>
                  <AlertDescription>
                    Add a video from YouTube, Vimeo, or other video platforms to embed in your page.
                  </AlertDescription>
                </Alert>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="videoEmbed">Video URL</Label>
                        <Input
                          id="videoEmbed"
                          name="videoEmbed"
                          placeholder="https://youtube.com/watch?v=..."
                          value={pageData.videoEmbed}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <p className="text-sm text-gray-500">
                          Supports YouTube, Vimeo, and other embed-friendly video platforms
                        </p>
                      </div>
                      
                      {pageData.videoEmbed && (
                        <div className="aspect-video bg-black/5 rounded-lg flex items-center justify-center">
                          <p className="text-sm text-gray-500">
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
          
          <div className="flex justify-end gap-2 mt-6">
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
              disabled={isLoading || !pageData.title.trim()}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Creating..." : "Save Page"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
