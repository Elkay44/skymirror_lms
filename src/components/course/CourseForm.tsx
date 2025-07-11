'use client';

import { useEffect } from 'react';
import { useCourseForm } from '@/context/CourseFormContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BasicInfoStep, MediaStep, StructureStep, CurriculumStep, PricingStep, SeoStep, FinalStep, FormNavigation } from './'; // Using barrel exports

interface CourseFormProps {
  onSubmit?: (data: any) => Promise<void>;
  isEditMode?: boolean;
}



export function CourseForm({ onSubmit, isEditMode = false }: CourseFormProps) {
  const { currentStep, isSubmitting, submitForm, goToStep } = useCourseForm();
  
  // If an onSubmit prop is provided, use it when the form is submitted
  const { formData: contextFormData } = useCourseForm();
  
  useEffect(() => {
    if (onSubmit && currentStep === 7) { // Only run when on the final step
      const handleFormSubmit = async () => {
        try {
          // Use the actual form data from context instead of empty object
          console.log('Submitting form on publish step:', contextFormData);
          await onSubmit(contextFormData);
        } catch (error) {
          console.error('Error submitting form:', error);
        }
      };
      
      // Don't auto-submit on load - we'll rely on the FormNavigation component's submit button
      // handleFormSubmit();
    }
  }, [currentStep, onSubmit, contextFormData]);

  const renderStep = () => {
    if (isSubmitting) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return <BasicInfoStep />;
      case 2:
        return <MediaStep />;
      case 3:
        return <StructureStep />;
      case 4:
        return <CurriculumStep />;
      case 5:
        return <PricingStep />;
      case 6:
        return <SeoStep />;
      case 7:
        return <FinalStep />;
      default:
        return <BasicInfoStep />;
    }
  };

  const getStepLabel = (step: number) => {
    const labels = {
      1: 'Basic Info',
      2: 'Media',
      3: 'Structure',
      4: 'Curriculum',
      5: 'Pricing',
      6: 'SEO',
      7: 'Publish'
    };
    return labels[step as keyof typeof labels] || '';
  };

  // Update the form title based on edit mode
  const formTitle = isEditMode ? 'Edit Course' : 'Create New Course';

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{formTitle}</h1>
      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-8">
        {[1, 2, 3, 4, 5, 6, 7].map((step) => {
          const isActive = currentStep === step;
          const isCompleted = currentStep > step;
          
          return (
            <div key={step} className="flex flex-col items-center relative flex-1">
              {/* Progress line before */}
              {step > 1 && (
                <div 
                  className={`absolute h-1 w-1/2 left-0 top-5 -z-10 ${
                    isCompleted || isActive ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
              {/* Progress line after */}
              {step < 7 && (
                <div 
                  className={`absolute h-1 w-1/2 right-0 top-5 -z-10 ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
              
              <Button
                variant="ghost"
                className={`w-10 h-10 p-0 rounded-full flex items-center justify-center ${isActive
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : isCompleted
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-muted hover:bg-muted/80'}` }
                onClick={() => goToStep(step)}
                aria-label={`Go to ${getStepLabel(step)} step`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{step}</span>
                )}
              </Button>
              <span 
                className={`text-sm mt-2 text-center ${
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {getStepLabel(step)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {renderStep()}
      </div>

      {/* Navigation */}
      <FormNavigation isEditMode={isEditMode} />
    </div>
  );
}
