'use client';

import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface Step4Props {
  formData: {
    image: File | null;
    isPublished: boolean;
    isPrivate: boolean;
  };
  onImageChange: (file: File | null) => void;
  onSwitchChange: (name: string, checked: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function Step4({ 
  formData, 
  onImageChange, 
  onSwitchChange, 
  onSubmit,
  isSubmitting 
}: Step4Props) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageChange(file);
    }
  }, [onImageChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
  });

  const removeImage = () => {
    setPreview(null);
    onImageChange(null);
  };

  return (
    <div className="space-y-8">
      {/* Course Image */}
      <div>
        <Label>Course Image</Label>
        <p className="text-sm text-gray-500 mb-4">
          Upload a high-quality image that represents your course
        </p>
        
        {preview ? (
          <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
            <Image
              src={preview}
              alt="Course preview"
              fill
              className="object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 rounded-full h-8 w-8"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="h-10 w-10 text-gray-400" />
              <div className="text-sm text-gray-600">
                {isDragActive ? (
                  <p>Drop the image here</p>
                ) : (
                  <>
                    <p className="font-medium">Drag and drop an image here</p>
                    <p className="text-xs">or click to browse files</p>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Recommended: 1280x720px (16:9 aspect ratio)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Publish Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Publish Course</Label>
            <p className="text-sm text-gray-500">
              Make this course available to students
            </p>
          </div>
          <Switch
            checked={formData.isPublished}
            onCheckedChange={(checked) => onSwitchChange('isPublished', checked)}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <Label>Make Course Private</Label>
            <p className="text-sm text-gray-500">
              Only students with a direct link can access this course
            </p>
          </div>
          <Switch
            checked={formData.isPrivate}
            onCheckedChange={(checked) => onSwitchChange('isPrivate', checked)}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button 
          type="button" 
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? 'Creating Course...' : 'Create Course'}
        </Button>
      </div>
    </div>
  );
}
