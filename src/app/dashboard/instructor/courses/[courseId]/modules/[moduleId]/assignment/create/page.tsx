'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { ArrowLeft, FileCheck2, Info, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { MarkdownEditor } from '@/components/editor/markdown-editor';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '', // Added to match backend schema
    instructions: '',
    dueDate: '', // ISO date string
    maxScore: 100,
    submissionType: 'TEXT', // TEXT, FILE, LINK, MULTIPLE_FILES
    allowLateSubmissions: true,
    isPublished: false,
    allowGroupSubmissions: false,
    maxGroupSize: 4
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAssignmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setAssignmentData(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };

  // Handle toggle changes
  const handleToggleChange = (name: string) => {
    setAssignmentData(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setAssignmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle markdown editor changes
  const handleMarkdownChange = (value: string) => {
    setAssignmentData(prev => ({
      ...prev,
      instructions: value
    }));
  };

  // Create the assignment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignmentData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Transform the data to match API schema
      const apiData = {
        title: assignmentData.title,
        description: assignmentData.description || '', // Include description field
        instructions: assignmentData.instructions,
        dueDate: assignmentData.dueDate,
        maxScore: assignmentData.maxScore, // Use maxScore as the field is expected in the backend
        submissionType: assignmentData.submissionType, // Include the submission type
        isPublished: assignmentData.isPublished,
        allowLateSubmissions: assignmentData.allowLateSubmissions,
        // Exclude fields not in the backend schema
        // allowGroupSubmissions and maxGroupSize aren't in backend schema
      };
      
      await axios.post(
        `/api/courses/${courseId}/modules/${moduleId}/assignments`,
        apiData
      );
      
      toast.success('Assignment created successfully');
      
      // Redirect back to module page
      router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-2xl font-semibold">Create New Assignment</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center">
                <FileCheck2 className="mr-2 h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-medium">Assignment Details</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter assignment title"
                  value={assignmentData.title}
                  onChange={handleChange}
                  className="max-w-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="datetime-local"
                  value={assignmentData.dueDate}
                  onChange={handleChange}
                  className="max-w-[300px]"
                />
                <p className="text-sm text-muted-foreground">When this assignment is due</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxScore">Maximum Score</Label>
                <Input
                  id="maxScore"
                  name="maxScore"
                  type="number"
                  min={0}
                  value={assignmentData.maxScore}
                  onChange={handleNumberChange}
                  className="max-w-[200px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="submissionType">Submission Type</Label>
                <Select 
                  value={assignmentData.submissionType}
                  onValueChange={(value) => handleSelectChange('submissionType', value)}
                >
                  <SelectTrigger className="max-w-[300px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text Submission</SelectItem>
                    <SelectItem value="FILE">File Upload</SelectItem>
                    <SelectItem value="URL">URL/Link Submission</SelectItem>
                    <SelectItem value="MIXED">Multiple Formats</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">How students will submit their work</p>
              </div>

              <div className="space-y-2">
                <Label>Instructions</Label>
                <div className="border rounded-md p-1">
                  <MarkdownEditor 
                    value={assignmentData.instructions} 
                    onChange={handleMarkdownChange} 
                    placeholder="Enter detailed instructions for students..."
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Format instructions using markdown. Add details, requirements, and examples.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-medium">Assignment Settings</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowLateSubmissions" className="cursor-pointer">Allow Late Submissions</Label>
                    <p className="text-sm text-muted-foreground">Students can submit after the due date</p>
                  </div>
                  <Switch
                    id="allowLateSubmissions"
                    checked={assignmentData.allowLateSubmissions}
                    onCheckedChange={() => handleToggleChange('allowLateSubmissions')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPublished" className="cursor-pointer">Publish Assignment</Label>
                    <p className="text-sm text-muted-foreground">Make visible to students immediately</p>
                  </div>
                  <Switch
                    id="isPublished"
                    checked={assignmentData.isPublished}
                    onCheckedChange={() => handleToggleChange('isPublished')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-indigo-500" />
                    <div>
                      <Label htmlFor="allowGroupSubmissions" className="cursor-pointer">Enable Group Submissions</Label>
                      <p className="text-sm text-muted-foreground">Allow students to submit as groups</p>
                    </div>
                  </div>
                  <Switch
                    id="allowGroupSubmissions"
                    checked={assignmentData.allowGroupSubmissions}
                    onCheckedChange={() => handleToggleChange('allowGroupSubmissions')}
                  />
                </div>
                
                {assignmentData.allowGroupSubmissions && (
                  <div className="ml-7 pl-2 border-l border-gray-200">
                    <div className="space-y-2">
                      <Label htmlFor="maxGroupSize">Maximum Group Size</Label>
                      <Input
                        id="maxGroupSize"
                        name="maxGroupSize"
                        type="number"
                        min={2}
                        max={10}
                        value={assignmentData.maxGroupSize}
                        onChange={handleNumberChange}
                        className="max-w-[200px]"
                      />
                      <p className="text-sm text-muted-foreground">Maximum number of students per group</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6 space-x-4">
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
          {isLoading ? 'Creating...' : 'Create Assignment'}
          {isLoading && <span className="animate-spin">⏳</span>}
        </Button>
      </div>
    </div>
  );
}
