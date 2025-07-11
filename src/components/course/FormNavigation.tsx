'use client';

import { useCourseForm } from '@/context/CourseFormContext';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface FormNavigationProps {
  isEditMode?: boolean;
}

export function FormNavigation({ isEditMode }: FormNavigationProps = {}) {
  const {
    currentStep,
    isSubmitting,
    hasDraft,
    prevStep,
    nextStep,
    submitForm,
    saveDraft,
    loadDraft,
  } = useCourseForm();
  
  // Detect if we're in edit mode based on the URL path
  const pathname = usePathname();
  const isInEditMode = isEditMode || pathname?.includes('/edit');

  const isLastStep = currentStep === 7;
  const isFirstStep = currentStep === 1;

  const handleNext = () => {
    if (isLastStep) {
      submitForm();
    } else {
      nextStep();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
      <div className="space-x-2">
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={isSubmitting}
          >
            Back
          </Button>
        )}
        
        {hasDraft && !isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={loadDraft}
            disabled={isSubmitting}
          >
            Load Draft
          </Button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={saveDraft}
          disabled={isSubmitting}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Draft
        </Button>
        
        <Button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <span className="mr-2">
                <span className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              </span>
              {isLastStep ? 'Saving...' : 'Loading...'}
            </>
          ) : isLastStep ? (
            isInEditMode ? 'Update Course' : 'Create Course'
          ) : (
            'Next Step'
          )}
        </Button>
      </div>
    </div>
  );
}
