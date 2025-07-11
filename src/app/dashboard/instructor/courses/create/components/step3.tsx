'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Step3Props {
  formData: {
    requirements: string[];
    learningOutcomes: string[];
    targetAudience: string[];
  };
  onFormChange: (name: string, value: string[]) => void;
}

export function Step3({ formData, onFormChange }: Step3Props) {
  const [requirement, setRequirement] = useState('');
  const [outcome, setOutcome] = useState('');
  const [audience, setAudience] = useState('');

  const addItem = (type: 'requirements' | 'learningOutcomes' | 'targetAudience') => {
    const value = type === 'requirements' ? requirement : 
                 type === 'learningOutcomes' ? outcome : audience;
    
    if (value.trim()) {
      onFormChange(type, [...formData[type], value.trim()]);
      
      // Clear the input
      if (type === 'requirements') setRequirement('');
      else if (type === 'learningOutcomes') setOutcome('');
      else setAudience('');
    }
  };

  const removeItem = (type: 'requirements' | 'learningOutcomes' | 'targetAudience', index: number) => {
    const newItems = [...formData[type]];
    newItems.splice(index, 1);
    onFormChange(type, newItems);
  };

  return (
    <div className="space-y-8">
      {/* Requirements */}
      <div>
        <Label>Course Requirements</Label>
        <p className="text-sm text-gray-500 mb-2">
          What do students need to know before taking this course?
        </p>
        <div className="flex gap-2 mb-2">
          <Input
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="e.g. Basic JavaScript knowledge"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('requirements'))}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => addItem('requirements')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {formData.requirements.map((req, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span>{req}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem('requirements', index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Outcomes */}
      <div>
        <Label>What Will Students Learn?</Label>
        <p className="text-sm text-gray-500 mb-2">
          List the key learning outcomes for this course
        </p>
        <div className="flex gap-2 mb-2">
          <Input
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g. Build a full-stack application"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('learningOutcomes'))}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => addItem('learningOutcomes')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {formData.learningOutcomes.map((outcome, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span>{outcome}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem('learningOutcomes', index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <Label>Target Audience</Label>
        <p className="text-sm text-gray-500 mb-2">
          Who is this course for?
        </p>
        <div className="flex gap-2 mb-2">
          <Input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g. Beginner web developers"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('targetAudience'))}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => addItem('targetAudience')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {formData.targetAudience.map((aud, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span>{aud}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem('targetAudience', index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
