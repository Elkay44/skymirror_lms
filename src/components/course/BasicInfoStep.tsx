'use client';

import { useCourseForm } from '@/context/CourseFormContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function BasicInfoStep() {
  const { formData, errors, handleChange } = useCourseForm();

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <Label htmlFor="title">Course Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Learn Advanced React"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && <p className="text-sm text-red-500 mt-1 break-words">{errors.title}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          {formData.title.length}/100 characters
        </p>
      </div>
      
      <div>
        <Label htmlFor="shortDescription">Short Description *</Label>
        <Textarea
          id="shortDescription"
          value={formData.shortDescription}
          onChange={(e) => handleChange('shortDescription', e.target.value)}
          placeholder="A brief description of your course"
          rows={3}
          className={errors.shortDescription ? 'border-red-500' : ''}
        />
        {errors.shortDescription && (
          <p className="text-sm text-red-500 mt-1 break-words">{errors.shortDescription}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formData.shortDescription.length}/200 characters
        </p>
      </div>
      
      <div>
        <Label htmlFor="description">Detailed Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="A detailed description of what students will learn"
          rows={6}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder="e.g., Web Development"
          />
        </div>
        
        <div>
          <Label htmlFor="level">Level</Label>
          <Select
            value={formData.level}
            onValueChange={(value) => handleChange('level', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
