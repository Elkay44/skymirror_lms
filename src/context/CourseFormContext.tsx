import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export type Level = 'beginner' | 'intermediate' | 'advanced';
export type ApiLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface FormData {
  // Step 1: Basic Information
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: Level;
  language: string;
  
  // Step 2: Course Media
  imageFile: File | null;
  imagePreview: string;
  promoVideoUrl: string;
  
  // Step 3: Course Structure
  requirements: string[];
  learningOutcomes: string[];
  targetAudience: string[];

  // Step 4: Curriculum
  sections: CourseSection[];
  
  // Step 5: Pricing & Marketing
  price: number;
  isFree: boolean;
  hasDiscount: boolean;
  discountedPrice: number;
  saleEndDate?: string;
  hasEnrollmentLimit: boolean;
  enrollmentLimit: number;
  hasAccessLimit: boolean;
  accessDuration?: number;
  accessPeriod?: 'days' | 'weeks' | 'months' | 'years';
  availableInBundles: boolean;
  offersCertificate: boolean;
  
  // Step 6: SEO & Discoverability
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  slug?: string;
  socialTitle?: string;
  socialDescription?: string;
  socialImageUrl?: string;
  
  // Step 7: Settings
  isPublished: boolean;
  isPrivate: boolean;
}

export interface CourseSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'download';
  contentUrl?: string;
  contentText?: string;
  duration?: number;
  order: number;
  isPublished: boolean;
  isFree: boolean;
  isPreview: boolean;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

interface CourseFormContextType {
  formData: FormData;
  errors: FormErrors;
  currentStep: number;
  isSubmitting: boolean;
  handleChange: (field: keyof FormData, value: any) => void;
  handleArrayFieldChange: (field: 'requirements' | 'learningOutcomes' | 'targetAudience', index: number, value: string) => void;
  handleAddArrayItem: (field: 'requirements' | 'learningOutcomes' | 'targetAudience') => void;
  handleRemoveArrayItem: (field: 'requirements' | 'learningOutcomes' | 'targetAudience', index: number) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  submitForm: () => Promise<void>;
  saveDraft: () => void;
  loadDraft: () => void;
  hasDraft: boolean;
}

const STORAGE_KEY = 'course_draft';

const CourseFormContext = createContext<CourseFormContextType | undefined>(undefined);

interface CourseFormProviderProps {
  children: React.ReactNode;
  initialData?: Partial<FormData>;
  isEditMode?: boolean;
  onSuccess?: (courseId: string) => void;
  onError?: (error: Error) => void;
}

export function CourseFormProvider({ 
  children,
  initialData = {},
  isEditMode = false,
  onSuccess,
  onError
}: CourseFormProviderProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasDraft, setHasDraft] = useState(false);
  
  const [formData, setFormData] = useState<FormData>(() => ({
    // Basic Information
    title: initialData?.title || '',
    shortDescription: initialData?.shortDescription || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    level: initialData?.level || 'beginner',
    language: initialData?.language || 'en',
    
    // Course Media
    imageFile: null,
    imagePreview: initialData?.imagePreview || '',
    promoVideoUrl: initialData?.promoVideoUrl || '',
    
    // Course Structure
    requirements: initialData?.requirements?.length ? [...initialData.requirements] : [''],
    learningOutcomes: initialData?.learningOutcomes?.length ? [...initialData.learningOutcomes] : [''],
    targetAudience: initialData?.targetAudience?.length ? [...initialData.targetAudience] : [''],
    
    // Curriculum
    sections: initialData?.sections || [
      {
        id: crypto.randomUUID(),
        title: 'Introduction',
        description: 'Getting started with the course',
        order: 0,
        isPublished: true,
        lessons: [
          {
            id: crypto.randomUUID(),
            title: 'Welcome to the Course',
            description: 'An overview of what you will learn',
            type: 'video',
            duration: 5,
            order: 0,
            isPublished: true,
            isFree: true,
            isPreview: true,
          }
        ]
      }
    ],
    
    // Pricing & Marketing
    price: initialData?.price || 0,
    isFree: initialData?.isFree || false,
    hasDiscount: initialData?.hasDiscount || false,
    discountedPrice: initialData?.discountedPrice || 0,
    saleEndDate: initialData?.saleEndDate,
    hasEnrollmentLimit: initialData?.hasEnrollmentLimit || false,
    enrollmentLimit: initialData?.enrollmentLimit || 50,
    hasAccessLimit: initialData?.hasAccessLimit || false,
    accessDuration: initialData?.accessDuration || 30,
    accessPeriod: initialData?.accessPeriod || 'days',
    availableInBundles: initialData?.availableInBundles !== false,
    offersCertificate: initialData?.offersCertificate !== false,
    
    // SEO & Discoverability
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
    keywords: initialData?.keywords || [],
    slug: initialData?.slug || '',
    socialTitle: initialData?.socialTitle || '',
    socialDescription: initialData?.socialDescription || '',
    socialImageUrl: initialData?.socialImageUrl || '',
    
    // Settings
    isPublished: initialData?.isPublished || false,
    isPrivate: initialData?.isPrivate || false,
  }));

  // Check for saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    setHasDraft(!!savedDraft);
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: FormErrors = {};
    
    switch (step) {
      case 1:
        // Validate Basic Information
        if (!formData.title) newErrors.title = 'Title is required';
        if (!formData.shortDescription) newErrors.shortDescription = 'Short description is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.level) newErrors.level = 'Level is required';
        if (!formData.language) newErrors.language = 'Language is required';
        break;
        
      case 2:
        // Validate Media
        // Only validate if imagePreview is empty and no file is selected
        if (!formData.imagePreview && !formData.imageFile) {
          newErrors.imageFile = 'Course image is required';
        }
        break;
        
      case 3:
        // Validate Structure
        if (!formData.requirements.length || !formData.requirements[0]) {
          newErrors.requirements = 'At least one requirement is required';
        }
        if (!formData.learningOutcomes.length || !formData.learningOutcomes[0]) {
          newErrors.learningOutcomes = 'At least one learning outcome is required';
        }
        if (!formData.targetAudience.length || !formData.targetAudience[0]) {
          newErrors.targetAudience = 'At least one target audience is required';
        }
        break;

      case 4:
        // Validate Curriculum
        if (!formData.sections || formData.sections.length === 0) {
          newErrors.sections = 'At least one section is required';
        } else {
          const hasEmptySections = formData.sections.some(section => !section.title);
          if (hasEmptySections) {
            newErrors.sections = 'All sections must have titles';
          }
          
          const hasEmptyLessons = formData.sections.some(section => 
            section.lessons.some(lesson => !lesson.title)
          );
          if (hasEmptyLessons) {
            newErrors.sections = 'All lessons must have titles';
          }
        }
        break;
      
      case 5:
        // Validate Pricing & Marketing
        if (!formData.isFree && (!formData.price || formData.price <= 0)) {
          newErrors.price = 'Price must be greater than 0 or course must be marked as free';
        }
        if (formData.hasDiscount && (!formData.discountedPrice || formData.discountedPrice <= 0)) {
          newErrors.discountedPrice = 'Discounted price must be greater than 0';
        }
        if (formData.hasDiscount && formData.discountedPrice >= formData.price) {
          newErrors.discountedPrice = 'Discounted price must be less than regular price';
        }
        if (formData.hasEnrollmentLimit && (!formData.enrollmentLimit || formData.enrollmentLimit <= 0)) {
          newErrors.enrollmentLimit = 'Enrollment limit must be greater than 0';
        }
        if (formData.hasAccessLimit && (!formData.accessDuration || formData.accessDuration <= 0)) {
          newErrors.accessDuration = 'Access duration must be greater than 0';
        }
        break;

      case 6:
        // Validate SEO & Discoverability
        if (formData.seoTitle && formData.seoTitle.length > 60) {
          newErrors.seoTitle = 'SEO title should be 60 characters or less';
        }
        if (formData.seoDescription && formData.seoDescription.length > 160) {
          newErrors.seoDescription = 'SEO description should be 160 characters or less';
        }
        break;
      
      case 7:
        // Final step - no specific validation
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    // Ensure the step is within valid range
    const targetStep = Math.max(1, Math.min(step, 7));
    setCurrentStep(targetStep);
  }, []);

  const handleChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleArrayFieldChange = useCallback((
    field: 'requirements' | 'learningOutcomes' | 'targetAudience',
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    handleChange(field, newArray);
  }, [formData, handleChange]);

  const handleAddArrayItem = useCallback((field: 'requirements' | 'learningOutcomes' | 'targetAudience') => {
    handleChange(field, [...formData[field], '']);
  }, [formData, handleChange]);

  const handleRemoveArrayItem = useCallback((
    field: 'requirements' | 'learningOutcomes' | 'targetAudience',
    index: number
  ) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      handleChange(field, newArray);
    }
  }, [formData, handleChange]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, imagePreview: 'Please upload a valid image file' }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, imagePreview: 'Image must be less than 5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange('imageFile', file);
      handleChange('imagePreview', reader.result as string);
      
      // Clear any previous image errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.imagePreview;
        return newErrors;
      });
    };
    reader.readAsDataURL(file);
  }, [handleChange]);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setHasDraft(true);
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
    }
  }, [formData]);

  const loadDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
        toast.success('Draft loaded');
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      toast.error('Failed to load draft');
    }
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasDraft(false);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  const submitForm = useCallback(async () => {
    // Clear previous errors
    setErrors({});
    
    // Validate current step
    if (!validateStep(currentStep)) return;
    
    // Additional validation for short description
    if (currentStep === 1 && formData.shortDescription.trim().length < 10) {
      setErrors(prev => ({
        ...prev,
        shortDescription: 'Short description must be at least 10 characters'
      }));
      return;
    }
    
    if (currentStep < 7) {
      nextStep();
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Validate required fields
      const requiredFields = {
        title: formData.title,
        shortDescription: formData.shortDescription,
        category: formData.category,
        level: formData.level,
        requirements: formData.requirements,
        learningOutcomes: formData.learningOutcomes,
        targetAudience: formData.targetAudience,
        imagePreview: formData.imagePreview
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value || (Array.isArray(value) && value.length === 0))
        .map(([field]) => field);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log('Form data being sent:', {
        title: formData.title,
        shortDescription: formData.shortDescription,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        language: formData.language,
        isPublished: formData.isPublished,
        isPrivate: formData.isPrivate,
        requirements: formData.requirements,
        learningOutcomes: formData.learningOutcomes,
        targetAudience: formData.targetAudience,
        imagePreview: formData.imagePreview
      });

      // Validate short description length
      const shortDescription = formData.shortDescription.trim();
      if (shortDescription.length < 10) {
        setErrors(prev => ({
          ...prev,
          shortDescription: 'Short description must be at least 10 characters'
        }));
        // Scroll to the error
        const element = document.getElementById('shortDescription');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
        throw new Error('Short description must be at least 10 characters');
      }

      // Ensure level is in the correct format
      const level = formData.level.toLowerCase();
      if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
        throw new Error('Invalid level. Must be one of: beginner, intermediate, advanced');
      }

      // Prepare form data
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('shortDescription', formData.shortDescription.trim());
      formDataToSend.append('description', formData.description?.trim() || '');
      formDataToSend.append('category', formData.category.trim());
      formDataToSend.append('level', level);
      formDataToSend.append('language', formData.language?.trim() || 'en');
      formDataToSend.append('isPublished', String(!!formData.isPublished));
      formDataToSend.append('isPrivate', String(!!formData.isPrivate));
      formDataToSend.append('requirements', JSON.stringify(formData.requirements || []));
      formDataToSend.append('learningOutcomes', JSON.stringify(formData.learningOutcomes || []));
      formDataToSend.append('targetAudience', JSON.stringify(formData.targetAudience || []));

      // Handle image data
      if (formData.imageFile) {
        try {
          const reader = new FileReader();
          reader.readAsDataURL(formData.imageFile);
          await new Promise<void>((resolve, reject) => {
            reader.onloadend = () => {
              if (reader.result) {
                formDataToSend.append('imagePreview', reader.result as string);
              }
              resolve();
            };
            reader.onerror = () => {
              reject(new Error('Failed to read image file'));
            };
          });
        } catch (error) {
          console.error('Error processing image:', error);
          // Don't throw error here, just log and continue without image
        }
      } else if (formData.imagePreview) {
        formDataToSend.append('imagePreview', formData.imagePreview.trim());
      } else {
        // If no image is provided, send an empty string as per schema
        formDataToSend.append('imagePreview', '');
      }

      console.log('Sending request to /api/courses with form data:', {
        title: formDataToSend.get('title'),
        category: formDataToSend.get('category'),
        level: formDataToSend.get('level'),
        hasImage: !!formDataToSend.get('imagePreview')
      });

      let response;
      try {
        response = await fetch('/api/courses', {
          method: 'POST',
          body: formDataToSend
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Raw error response:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            console.error('Parsed error response:', {
              status: response.status,
              statusText: response.statusText,
              errorData
            });
            throw new Error(errorData.message || errorData.error || errorData.details?.message || `Failed to save course (status: ${response.status}, ${response.statusText})`);
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            throw new Error(`Failed to save course (status: ${response.status}, ${response.statusText}): ${errorText.substring(0, 200)}`);
          }
        }
      } catch (error) {
        console.error('Network or fetch error:', error);
        throw new Error(`Failed to connect to server: ${error instanceof Error ? error.message : String(error)}`);
      }

      const result = await response.json();
      console.log('Successful response:', result);
      
      // Clear draft on successful submission
      clearDraft();
      
      // Call success callback if provided
      if (onSuccess && result.id) {
        onSuccess(result.id);
      } else {
        // Fallback to default success behavior
        toast.success(isEditMode ? 'Course updated successfully' : 'Course created successfully');
        router.push('/dashboard/instructor/courses');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving course:', error);
      
      // Call error callback if provided
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      } else {
        // Fallback to default error behavior
        toast.error('Failed to save course. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, currentStep, isEditMode, router, validateStep, nextStep, clearDraft, onSuccess, onError]);

  return (
    <CourseFormContext.Provider
      value={{
        formData,
        errors,
        currentStep,
        isSubmitting,
        hasDraft,
        handleChange,
        handleArrayFieldChange,
        handleAddArrayItem,
        handleRemoveArrayItem,
        handleImageChange,
        nextStep,
        prevStep,
        goToStep,
        submitForm,
        saveDraft,
        loadDraft,
      }}
    >
      {children}
    </CourseFormContext.Provider>
  );
}

export function useCourseForm() {
  const context = useContext(CourseFormContext);
  if (!context) {
    throw new Error('useCourseForm must be used within a CourseFormProvider');
  }
  return context;
}
