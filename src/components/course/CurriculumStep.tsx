'use client';

import { useState, useEffect } from 'react';
import { useCourseForm } from '@/context/CourseFormContext';
import { CourseSection } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, FileText, Video, Clock, Download, BookOpen, MessageSquare } from 'lucide-react';
// Import UI components from barrel export
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui';

export function CurriculumStep() {
  const { formData, handleChange } = useCourseForm();
  const [sections, setSections] = useState<CourseSection[]>(formData.sections || []);
  
  // Initialize with default section if none exists
  useEffect(() => {
    if (!sections || sections.length === 0) {
      const initialSection: CourseSection = {
        id: `section-${Date.now()}`,
        title: 'Introduction',
        description: 'Getting started with the course',
        order: 0,
        isPublished: true,
        lessons: [
          {
            id: `lesson-${Date.now()}`,
            title: 'Welcome to the Course',
            description: 'An overview of what you will learn',
            type: 'video',
            contentUrl: '',
            duration: 5,
            order: 0,
            isPublished: true,
            isFree: true,
            isPreview: true,
          }
        ]
      };
      setSections([initialSection]);
      handleChange('sections', [initialSection]);
    }
  }, [sections]);
  
  // No longer needed as we use crypto.randomUUID()
  // const generateId = () => Math.random().toString(36).substring(2, 11);
  
  // Generate unique IDs without using crypto
  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Add a new section
  const addSection = () => {
    const newSection: CourseSection = {
      id: generateId(),
      title: `New Section`,
      description: '',
      order: sections.length,
      lessons: [],
      isPublished: true
    };
    
    const updatedSections = [...sections, newSection];
    setSections(updatedSections);
    handleChange('sections', updatedSections);
  };
  
  // Add a new lesson to a section
  const addLesson = (sectionId: string) => {
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lessons: [
            ...section.lessons, 
            {
              id: generateId(),
              title: `New Lesson`,
              description: '',
              type: 'video' as const,
              contentUrl: '',
              duration: 5,
              order: section.lessons.length,
              isPublished: true,
              isFree: false,
              isPreview: false
            }
          ]
        };
      }
      return section;
    });
    
    setSections(updatedSections);
    handleChange('sections', updatedSections);
  };
  
  // Update a section
  const updateSection = (sectionId: string, field: string, value: any) => {
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, [field]: value };
      }
      return section;
    });
    
    setSections(updatedSections);
    handleChange('sections', updatedSections);
  };
  
  // Update a lesson
  const updateLesson = (sectionId: string, lessonId: string, field: string, value: any) => {
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        const updatedLessons = section.lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return { ...lesson, [field]: value };
          }
          return lesson;
        });
        return { ...section, lessons: updatedLessons };
      }
      return section;
    });
    
    setSections(updatedSections);
    handleChange('sections', updatedSections);
  };
  
  // Remove a section
  const removeSection = (sectionId: string) => {
    const updatedSections = sections.filter(section => section.id !== sectionId);
    // Update order after removal
    const reorderedSections = updatedSections.map((section, index) => ({
      ...section,
      order: index
    }));
    setSections(reorderedSections);
    handleChange('sections', reorderedSections);
  };
  
  // Remove a lesson
  const removeLesson = (sectionId: string, lessonId: string) => {
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        const filteredLessons = section.lessons.filter(lesson => lesson.id !== lessonId);
        // Update lesson order after removal
        const reorderedLessons = filteredLessons.map((lesson, index) => ({
          ...lesson,
          order: index
        }));
        return {
          ...section,
          lessons: reorderedLessons
        };
      }
      return section;
    });
    
    setSections(updatedSections);
    handleChange('sections', updatedSections);
  };
  
  // Get lesson type icon
  const getLessonTypeIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="h-4 w-4 mr-2" />;
      case 'text': return <FileText className="h-4 w-4 mr-2" />;
      case 'quiz': return <MessageSquare className="h-4 w-4 mr-2" />;
      case 'assignment': return <BookOpen className="h-4 w-4 mr-2" />;
      case 'download': return <Download className="h-4 w-4 mr-2" />;
      default: return <FileText className="h-4 w-4 mr-2" />;
    }
  };
  
  // Get lesson type options
  const getLessonTypeOptions = () => {
    return [
      { value: 'video', label: 'Video Lesson' },
      { value: 'text', label: 'Text Lesson' },
      { value: 'quiz', label: 'Quiz' },
      { value: 'assignment', label: 'Assignment' },
      { value: 'download', label: 'Downloadable Resource' }
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-xl font-semibold">Course Curriculum</h2>
        <p className="text-muted-foreground text-sm">
          Organize your course content into sections and lessons.
        </p>
        
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md bg-muted/40 mt-6">
            <p className="text-muted-foreground mb-4">No sections yet. Add your first section.</p>
            <Button onClick={addSection}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add First Section
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={addSection} variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Section
              </Button>
            </div>
            
            <Accordion type="multiple" className="w-full space-y-4">
              {sections.map((section, index) => (
                <Card key={section.id} className="overflow-hidden border">
                  <AccordionItem value={section.id} className="border-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-2 text-left">
                        <div className="h-6 w-6 flex items-center justify-center rounded-full bg-muted">
                          {index + 1}
                        </div>
                        <div className="font-medium">{section.title}</div>
                        {section.isPublished ? (
                          <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400">
                            Draft
                          </Badge>
                        )}
                        <Badge variant="secondary" className="ml-auto">
                          {section.lessons.length} {section.lessons.length === 1 ? 'Lesson' : 'Lessons'}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {/* Section Fields */}
                        <div className="space-y-3">
                          <Input
                            value={section.title}
                            onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                            placeholder="Section Title"
                            className="font-medium"
                          />
                          
                          <Textarea
                            value={section.description || ''}
                            onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                            placeholder="Section Description"
                            className="resize-none h-20"
                          />
                        </div>
                        
                        {/* Lessons */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium">Lessons</h4>
                            <Button variant="ghost" size="sm" onClick={() => addLesson(section.id)}>
                              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                              Add Lesson
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {section.lessons.length === 0 ? (
                              <div className="p-4 border border-dashed rounded-md flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">No lessons yet</p>
                              </div>
                            ) : (
                              section.lessons.map((lesson, lessonIndex) => (
                                <Card key={lesson.id} className="overflow-hidden">
                                  <CardContent className="p-3">
                                    <div className="flex items-start gap-3">
                                      <div className="h-5 w-5 flex items-center justify-center rounded-full bg-muted text-xs">
                                        {lessonIndex + 1}
                                      </div>
                                      
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center">
                                            {getLessonTypeIcon(lesson.type)}
                                            <Input
                                              value={lesson.title}
                                              onChange={(e) => updateLesson(section.id, lesson.id, 'title', e.target.value)}
                                              placeholder="Lesson title"
                                              className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                            />
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Select 
                                              value={lesson.type}
                                              onValueChange={(value: any) => updateLesson(section.id, lesson.id, 'type', value)}
                                            >
                                              <SelectTrigger className="w-[140px] h-7 text-xs">
                                                <SelectValue placeholder="Select type" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {getLessonTypeOptions().map(option => (
                                                  <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <Button
                                              onClick={() => removeLesson(section.id, lesson.id)}
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0"
                                            >
                                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                            </Button>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                          <div className="flex items-center gap-2 text-xs">
                                            <Label htmlFor={`duration-${lesson.id}`} className="text-muted-foreground">
                                              <Clock className="h-3 w-3 inline mr-1" /> Duration
                                            </Label>
                                            <Input
                                              id={`duration-${lesson.id}`}
                                              type="number"
                                              value={lesson.duration || 0}
                                              onChange={(e) => updateLesson(section.id, lesson.id, 'duration', parseInt(e.target.value) || 0)}
                                              className="w-16 h-7 text-xs"
                                              min="0"
                                            /> min
                                          </div>
                                          
                                          <div className="flex items-center justify-end gap-4">
                                            <div className="flex items-center space-x-2">
                                              <Switch 
                                                id={`free-${lesson.id}`}
                                                checked={lesson.isFree}
                                                onCheckedChange={(checked) => updateLesson(section.id, lesson.id, 'isFree', checked)}
                                              />
                                              <Label htmlFor={`free-${lesson.id}`} className="text-xs">Free</Label>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                              <Switch 
                                                id={`preview-${lesson.id}`}
                                                checked={lesson.isPreview}
                                                onCheckedChange={(checked) => updateLesson(section.id, lesson.id, 'isPreview', checked)}
                                              />
                                              <Label htmlFor={`preview-${lesson.id}`} className="text-xs">Preview</Label>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        </div>
                        
                        {/* Section Actions */}
                        <div className="flex justify-between pt-2 border-t border-border">
                          <Button
                            onClick={() => removeSection(section.id)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Remove Section
                          </Button>
                          
                          <Button
                            onClick={() => updateSection(section.id, 'isPublished', !section.isPublished)}
                            variant={section.isPublished ? "outline" : "secondary"}
                            size="sm"
                          >
                            {section.isPublished ? 'Set as Draft' : 'Publish Section'}
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
}
