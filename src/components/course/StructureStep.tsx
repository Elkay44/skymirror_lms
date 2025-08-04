'use client';

import { useCourseForm } from '@/context/CourseFormContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface ArrayFieldProps {
  field: 'requirements' | 'learningOutcomes' | 'targetAudience';
  label: string;
  placeholder: string;
  description?: string;
}

function ArrayField({ field, label, placeholder, description }: ArrayFieldProps) {
  const { formData, errors, handleArrayFieldChange, handleAddArrayItem, handleRemoveArrayItem } = useCourseForm();
  
  const items = formData[field] as string[];
  const error = errors[field];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-sm text-muted-foreground mb-2 break-words">{description}</p>}
      
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2 min-w-0">
            <Input
              value={item}
              onChange={(e) => handleArrayFieldChange(field, index, e.target.value)}
              placeholder={`${placeholder} ${index + 1}`}
              className={error && !item.trim() ? 'border-red-500' : ''}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleRemoveArrayItem(field, index)}
              disabled={items.length <= 1}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddArrayItem(field)}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {field === 'requirements' ? 'Requirement' : field === 'learningOutcomes' ? 'Outcome' : 'Audience'}
        </Button>
      </div>
      
      {error && <p className="text-sm text-red-500 break-words">{error}</p>}
    </div>
  );
}

export function StructureStep() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <ArrayField
        field="requirements"
        label="Requirements"
        placeholder="What should students know before taking this course?"
        description="List the skills, knowledge, or tools learners should have before starting."
      />
      
      <ArrayField
        field="learningOutcomes"
        label="Learning Outcomes"
        placeholder="What will students learn?"
        description="List what students will be able to do after completing the course."
      />
      
      <ArrayField
        field="targetAudience"
        label="Target Audience"
        placeholder="Who is this course for?"
        description="Describe who would benefit most from this course."
      />
    </div>
  );
}
