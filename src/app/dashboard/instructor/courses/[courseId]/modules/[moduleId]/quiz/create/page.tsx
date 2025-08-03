'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { ArrowLeft, Info, ListChecks, HelpCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CreateQuizPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    timeLimit: 30, // in minutes
    passingScore: 60, // percentage
    attemptsAllowed: 3,
    isPublished: false,
    showCorrectAnswers: true,
    // Note: instructions and randomizeQuestions not supported in current schema
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuizData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setQuizData(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };

  // Handle toggle changes
  const handleToggleChange = (name: string) => {
    setQuizData(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }));
  };

  // Create the quiz
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quizData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await axios.post(
        `/api/courses/${courseId}/modules/${moduleId}/quizzes`,
        quizData
      );
      
      toast.success('Quiz created successfully');
      
      // Redirect back to module page
      router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Failed to create quiz');
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
          <h1 className="text-2xl font-semibold">Create New Quiz</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center">
                <ListChecks className="mr-2 h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-medium">Quiz Details</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter quiz title"
                  value={quizData.title}
                  onChange={handleChange}
                  className="max-w-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter a brief description of this quiz"
                  value={quizData.description}
                  onChange={handleChange}
                  rows={3}
                  className="max-w-2xl"
                />
              </div>

              {/* Instructions field commented out - not in current Prisma schema
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions for Students</Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  placeholder="Enter instructions for students taking this quiz"
                  value={quizData.instructions}
                  onChange={handleChange}
                  rows={4}
                  className="max-w-2xl"
                />
              </div>
              */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center">
                <HelpCircle className="mr-2 h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-medium">Quiz Settings</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    name="timeLimit"
                    type="number"
                    min={1}
                    value={quizData.timeLimit}
                    onChange={handleNumberChange}
                    className="max-w-[200px]"
                  />
                  <p className="text-sm text-muted-foreground">Set 0 for no time limit</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    name="passingScore"
                    type="number"
                    min={0}
                    max={100}
                    value={quizData.passingScore}
                    onChange={handleNumberChange}
                    className="max-w-[200px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attemptsAllowed">Maximum Attempts</Label>
                  <Input
                    id="attemptsAllowed"
                    name="attemptsAllowed"
                    type="number"
                    min={1}
                    value={quizData.attemptsAllowed}
                    onChange={handleNumberChange}
                    className="max-w-[200px]"
                  />
                  <p className="text-sm text-muted-foreground">Set 0 for unlimited attempts</p>
                </div>

                <div className="space-y-4 sm:pt-4">
                  {/* Randomize Questions field commented out - not in current Prisma schema
                  <div className="flex items-center justify-between">
                    <Label htmlFor="randomizeQuestions" className="cursor-pointer">Randomize Questions</Label>
                    <Switch
                      id="randomizeQuestions"
                      checked={quizData.randomizeQuestions}
                      onCheckedChange={() => handleToggleChange('randomizeQuestions')}
                    />
                  </div>
                  */}

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCorrectAnswers" className="cursor-pointer">Show Correct Answers After Submission</Label>
                    <Switch
                      id="showCorrectAnswers"
                      checked={quizData.showCorrectAnswers}
                      onCheckedChange={() => handleToggleChange('showCorrectAnswers')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPublished" className="cursor-pointer">Publish Immediately</Label>
                    <Switch
                      id="isPublished"
                      checked={quizData.isPublished}
                      onCheckedChange={() => handleToggleChange('isPublished')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert className="mt-6 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle>Quiz Questions</AlertTitle>
        <AlertDescription>
          After creating the quiz, you'll be able to add questions from the quiz editor.
        </AlertDescription>
      </Alert>

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
          {isLoading ? 'Creating...' : 'Create Quiz'}
          {isLoading && <span className="animate-spin">⏳</span>}
        </Button>
      </div>
    </div>
  );
}
