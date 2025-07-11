'use client';

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { CourseFormData } from '@/types/course';
import { CourseFormProvider, FormData, Level, ApiLevel } from '@/context/CourseFormContext';
import { CourseForm } from './CourseForm';

// Helper to map between API and form level values
const levelToForm = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

const levelToApi = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
} as const;

type FormLevel = Level;
type ApiFormLevel = ApiLevel;

type CourseFormWrapperProps = {
  children: React.ReactNode;
  initialData?: Partial<CourseFormData>;
  onSubmit: (data: CourseFormData) => Promise<void>;
  isSubmitting?: boolean;
  isEditMode?: boolean;
  onSuccess?: (courseId: string) => void;
  onError?: (error: Error) => void;
};

// Helper function to convert API level to form level
const toFormLevel = (level?: string): FormLevel => {
  if (!level) return 'beginner';
  const normalized = level.toUpperCase() as ApiFormLevel;
  return levelToForm[normalized] || 'beginner';
};

// Helper function to convert form level to API level
const toApiLevel = (level: FormLevel): ApiFormLevel => {
  return levelToApi[level] || 'BEGINNER';
};

export function CourseFormWrapper({
  initialData,
  onSubmit,
  isSubmitting = false,
  isEditMode = false,
  onSuccess,
  onError,
  children,
}: CourseFormWrapperProps) {
  const [isSubmittingState, setIsSubmittingState] = useState(false);
  const effectiveIsSubmitting = isSubmitting || isSubmittingState;
  
  // Convert API data to form format if in edit mode
  const getFormInitialData = useCallback((): Partial<FormData> | undefined => {
    if (!initialData) return undefined;

    // Convert API level to form level if needed
    const level = initialData.level 
      ? (initialData.level as string).toLowerCase() === initialData.level 
        ? initialData.level as FormLevel 
        : toFormLevel(initialData.level as string)
      : 'beginner';

    // Create the form data with proper types
    const formData: any = {
      // Copy all properties from initialData
      ...initialData,
      // Override with converted values
      level,
      // Ensure arrays are never undefined
      requirements: initialData.requirements || [],
      learningOutcomes: initialData.learningOutcomes || [],
      targetAudience: initialData.targetAudience || [],
      // Ensure boolean fields have defaults
      isPublished: initialData.isPublished ?? false,
      isPrivate: initialData.isPrivate ?? false,
      // Handle image and video URLs
      imagePreview: (initialData as any).imageUrl || (initialData as any).imagePreview || '',
      imageFile: null, // Initialize as null, will be set if a new file is uploaded
      promoVideoUrl: (initialData as any).promoVideoUrl || '',
      // Ensure pricing fields have defaults
      price: initialData.price ?? 0,
      isFree: initialData.isFree ?? true,
      hasDiscount: initialData.hasDiscount ?? false,
      discountedPrice: initialData.discountedPrice ?? 0,
    };

    // Remove any undefined values to avoid type issues
    Object.keys(formData).forEach(key => {
      if (formData[key] === undefined) {
        delete formData[key];
      }
    });

    return formData as Partial<FormData>;
  }, [initialData]);

  // Convert form data to API format before submission
  const handleSubmit = useCallback(
    async (formData: FormData) => {
      try {
        setIsSubmittingState(true);

        // Convert form data to API format
        const apiData: CourseFormData = {
          ...formData,
          // Convert level to API format if needed
          level: (() => {
            if (!formData.level) return 'BEGINNER';
            const levelStr = formData.level.toString();
            return levelStr === levelStr.toUpperCase() 
              ? levelStr as ApiFormLevel 
              : toApiLevel(levelStr as FormLevel);
          })(),
          // Ensure all required CourseFormData properties are present
          price: formData.price || 0,
          isFree: formData.isFree ?? true,
          hasDiscount: formData.hasDiscount ?? false,
          discountedPrice: formData.discountedPrice || 0,
        };

        await onSubmit(apiData);

        if (onSuccess && initialData && 'id' in initialData) {
          onSuccess(initialData.id as string);
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error('An unknown error occurred'));
        }
      } finally {
        setIsSubmittingState(false);
      }
    },
    [onSubmit, onSuccess, onError, initialData]
  );

  const handleSuccess = useCallback((courseId: string) => {
    if (onSuccess) {
      onSuccess(courseId);
    }
  }, [onSuccess]);

  const handleError = useCallback((error: Error) => {
    console.error('Form error:', error);
    if (onError) {
      onError(error);
    }
  }, [onError]);

  return (
    <CourseFormProvider 
      initialData={getFormInitialData()}
      onSuccess={handleSuccess}
      onError={handleError}
    >
      <CourseForm onSubmit={handleSubmit} isEditMode={isEditMode} />
    </CourseFormProvider>
  );
}
