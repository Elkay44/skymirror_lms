'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Step5Props {
  formData: {
    targetAudience: string[];
    isPublished: boolean;
    isPrivate: boolean;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onToggle: (name: string, checked: boolean) => void;
  onArrayFieldChange: (field: string, index: number, value: string) => void;
  onAddArrayFieldItem: (field: string, defaultValue: string) => void;
  onRemoveArrayFieldItem: (field: string, index: number) => void;
}

export function Step5({
  formData,
  onArrayFieldChange,
  onAddArrayFieldItem,
  onRemoveArrayFieldItem,
  onToggle,
}: Step5Props) {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Target Audience Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between min-w-0">
          <h3 className="text-lg font-medium break-words">Target Audience</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddArrayFieldItem('targetAudience', '')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Target Audience
          </Button>
        </div>
        
        <div className="space-y-3">
          {formData.targetAudience.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 min-w-0">
              <Input
                value={item}
                onChange={(e) => onArrayFieldChange('targetAudience', index, e.target.value)}
                placeholder="E.g., Beginners in web development"
                className="flex-1 min-w-0"
              />
              {formData.targetAudience.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveArrayFieldItem('targetAudience', index)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium mb-4 break-words">Course Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between min-w-0">
            <div className="space-y-1">
              <Label htmlFor="isPublished">Publish Course</Label>
              <p className="text-sm text-muted-foreground break-words">
                {formData.isPublished 
                  ? 'Your course will be visible to students' 
                  : 'Your course will be saved as a draft'}
              </p>
            </div>
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) => onToggle('isPublished', checked)}
            />
          </div>

          <div className="flex items-center justify-between min-w-0">
            <div className="space-y-1">
              <Label htmlFor="isPrivate">Make Course Private</Label>
              <p className="text-sm text-muted-foreground break-words">
                {formData.isPrivate 
                  ? 'Only students with the link can access this course' 
                  : 'Anyone can find and enroll in this course'}
              </p>
            </div>
            <Switch
              id="isPrivate"
              checked={formData.isPrivate}
              onCheckedChange={(checked) => onToggle('isPrivate', checked)}
              disabled={!formData.isPublished}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
