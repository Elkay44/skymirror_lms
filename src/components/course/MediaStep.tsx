'use client';

import { useCourseForm } from '@/context/CourseFormContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

export function MediaStep() {
  const { formData, errors, handleChange, handleImageChange } = useCourseForm();

  return (
    <div className="space-y-6">
      <div>
        <Label>Course Image *</Label>
        <div className="mt-1">
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-accent/50 transition-colors"
          >
            {formData.imagePreview ? (
              <div className="relative w-full">
                <img
                  src={formData.imagePreview}
                  alt="Course preview"
                  className="h-48 w-full object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-md">
                  <span className="text-white">Change Image</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 p-8">
                <Upload className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            )}
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
          {errors.imagePreview && (
            <p className="text-sm text-red-500 mt-1">{errors.imagePreview}</p>
          )}
        </div>
      </div>
      
      <div>
        <Label htmlFor="promoVideoUrl">Promo Video URL (Optional)</Label>
        <Input
          id="promoVideoUrl"
          type="url"
          value={formData.promoVideoUrl}
          onChange={(e) => handleChange('promoVideoUrl', e.target.value)}
          placeholder="e.g., https://youtube.com/your-video"
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Add a YouTube or Vimeo link to a promotional video for your course
        </p>
      </div>
    </div>
  );
}
