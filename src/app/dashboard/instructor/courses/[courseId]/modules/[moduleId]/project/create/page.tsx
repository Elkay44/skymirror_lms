'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { ArrowLeft, Code, GitBranch, Calendar, Link2, Info, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

export default function CreateProjectPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '', // ISO date string
    difficulty: 'MEDIUM', // BEGINNER, EASY, MEDIUM, HARD, ADVANCED
    estimatedHours: 8,
    technologies: '',
    requirements: '',
    resources: '',
    isPublished: false,
    allowTeamSubmissions: false,
    maxTeamSize: 3,
    githubTemplateUrl: ''
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setProjectData(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };

  // Handle toggle changes
  const handleToggleChange = (name: string) => {
    setProjectData(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle markdown editor changes
  const handleMarkdownChange = (value: string) => {
    setProjectData(prev => ({
      ...prev,
      instructions: value
    }));
  };

  // Create the project
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Transform the data to match API schema
      const apiData = {
        title: projectData.title,
        description: projectData.description,
        instructions: projectData.instructions,
        dueDate: projectData.dueDate,
        isPublished: projectData.isPublished,
        difficulty: projectData.difficulty,
        estimatedHours: projectData.estimatedHours,
        technologies: projectData.technologies,
        requirements: projectData.requirements,
        // Fix resources format to match the API schema
        resources: projectData.resources ? projectData.resources.split(',').map(url => ({
          title: 'Project Resource',
          url: url.trim(),
          type: 'LINK'
        })).filter(res => res.url !== '') : [],
        allowTeamSubmissions: projectData.allowTeamSubmissions,
        maxTeamSize: projectData.maxTeamSize,
        githubTemplateUrl: projectData.githubTemplateUrl
      };
      
      const response = await axios.post(
        `/api/courses/${courseId}/modules/${moduleId}/projects`,
        apiData
      );
      
      toast.success('Project created successfully');
      
      // Redirect back to module page
      router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
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
          <h1 className="text-2xl font-semibold">Create New Project</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center">
                <Code className="mr-2 h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-medium">Project Details</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter project title"
                  value={projectData.title}
                  onChange={handleChange}
                  className="max-w-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Brief Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter a brief description of this project"
                  value={projectData.description}
                  onChange={handleChange}
                  rows={3}
                  className="max-w-2xl"
                />
                <p className="text-sm text-muted-foreground">A short summary that will appear in project listings</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="datetime-local"
                  value={projectData.dueDate}
                  onChange={handleChange}
                  className="max-w-[300px]"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select 
                    value={projectData.difficulty}
                    onValueChange={(value) => handleSelectChange('difficulty', value)}
                  >
                    <SelectTrigger className="max-w-[300px]">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    name="estimatedHours"
                    type="number"
                    min={1}
                    value={projectData.estimatedHours}
                    onChange={handleNumberChange}
                    className="max-w-[200px]"
                  />
                  <p className="text-sm text-muted-foreground">Approximate time to complete</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="technologies">Technologies</Label>
                <Input
                  id="technologies"
                  name="technologies"
                  placeholder="e.g., React, Node.js, Python, TensorFlow"
                  value={projectData.technologies}
                  onChange={handleChange}
                  className="max-w-2xl"
                />
                <p className="text-sm text-muted-foreground">Technologies or frameworks used in this project</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-medium">Project Instructions & Requirements</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>Detailed Instructions</Label>
                <div className="border rounded-md p-1">
                  <MarkdownEditor 
                    value={projectData.instructions} 
                    onChange={handleMarkdownChange} 
                    placeholder="Enter detailed project instructions..."
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Format instructions using markdown. Include project goals and context.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  name="requirements"
                  placeholder="List specific requirements for this project"
                  value={projectData.requirements}
                  onChange={handleChange}
                  rows={4}
                  className="max-w-2xl"
                />
                <p className="text-sm text-muted-foreground">Specific features, functionality, or deliverables required</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resources">Additional Resources</Label>
                <Textarea
                  id="resources"
                  name="resources"
                  placeholder="List helpful resources, links, or references"
                  value={projectData.resources}
                  onChange={handleChange}
                  rows={3}
                  className="max-w-2xl"
                />
                <p className="text-sm text-muted-foreground">Helpful links, documentation, or materials</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center">
                <GitBranch className="mr-2 h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-medium">Project Settings</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isPublished" className="cursor-pointer">Publish Project</Label>
                  <p className="text-sm text-muted-foreground">Make visible to students immediately</p>
                </div>
                <Switch
                  id="isPublished"
                  checked={projectData.isPublished}
                  onCheckedChange={() => handleToggleChange('isPublished')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="githubTemplateUrl">GitHub Template Repository</Label>
                <div className="flex gap-2">
                  <Input
                    id="githubTemplateUrl"
                    name="githubTemplateUrl"
                    placeholder="https://github.com/username/repo-template"
                    value={projectData.githubTemplateUrl}
                    onChange={handleChange}
                    className="max-w-2xl"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Optional GitHub template repository for students to start from
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowTeamSubmissions" className="cursor-pointer">Allow Team Submissions</Label>
                  <p className="text-sm text-muted-foreground">Students can work in teams</p>
                </div>
                <Switch
                  id="allowTeamSubmissions"
                  checked={projectData.allowTeamSubmissions}
                  onCheckedChange={() => handleToggleChange('allowTeamSubmissions')}
                />
              </div>
              
              {projectData.allowTeamSubmissions && (
                <div className="ml-7 pl-2 border-l border-gray-200">
                  <div className="space-y-2">
                    <Label htmlFor="maxTeamSize">Maximum Team Size</Label>
                    <Input
                      id="maxTeamSize"
                      name="maxTeamSize"
                      type="number"
                      min={2}
                      max={10}
                      value={projectData.maxTeamSize}
                      onChange={handleNumberChange}
                      className="max-w-[200px]"
                    />
                    <p className="text-sm text-muted-foreground">Maximum number of students per team</p>
                  </div>
                </div>
              )}
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
          {isLoading ? 'Creating...' : 'Create Project'}
          {isLoading && <span className="animate-spin">⏳</span>}
        </Button>
      </div>
    </div>
  );
}
