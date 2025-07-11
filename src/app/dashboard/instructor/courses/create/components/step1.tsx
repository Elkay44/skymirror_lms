'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Step1Props {
  formData: {
    title: string;
    description: string;
    shortDescription: string;
    category: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    language: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onArrayFieldChange?: (field: string, index: number, value: string) => void;
  onAddArrayFieldItem?: (field: string, defaultValue: string) => void;
  onRemoveArrayFieldItem?: (field: string, index: number) => void;
  onToggle?: (name: string, checked: boolean) => void;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Step1({ formData, onChange }: Step1Props) {
  const levels = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
  ];

  const categories = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Design',
    'Business',
    'Marketing',
    'Photography',
    'Music',
  ];

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Course Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={onChange}
          placeholder="e.g. Learn Next.js from Scratch"
          required
        />
      </div>

      <div>
        <Label htmlFor="shortDescription">Short Description</Label>
        <Textarea
          id="shortDescription"
          name="shortDescription"
          value={formData.shortDescription}
          onChange={onChange}
          placeholder="A brief description of your course"
          className="min-h-[100px]"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Course Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onChange}
          placeholder="Detailed description of what students will learn"
          className="min-h-[150px]"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="level">Difficulty Level</Label>
          <Select
            value={formData.level}
            onValueChange={(value: string) => {
              // Create a synthetic event to match the expected type
              const event = {
                target: {
                  name: 'level',
                  value
                }
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(event);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value: string) => {
              // Create a synthetic event to match the expected type
              const event = {
                target: {
                  name: 'category',
                  value
                }
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(event);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="language">Language</Label>
        <Input
          id="language"
          name="language"
          value={formData.language}
          onChange={onChange}
          placeholder="e.g. English"
          required
        />
      </div>
    </div>
  );
}
