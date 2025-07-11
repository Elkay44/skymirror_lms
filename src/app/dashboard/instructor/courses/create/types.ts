export interface FormData {
  // Step 1: Basic Information
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: string;
  language: string;
  difficulty: string;
  
  // Step 2: Course Media
  imageFile: File | null;
  imagePreview: string;
  promoVideoUrl: string;
  
  // Pricing (optional, can be set later)
  price: number;
  isFree: boolean;
  hasDiscount: boolean;
  discountedPrice: number;
  
  // Step 3: Course Structure
  requirements: string[];
  learningOutcomes: string[];
  
  // Step 4: Final Touches
  targetAudience: string[];
  isPublished: boolean;
  isPrivate: boolean;
  
  // Metadata
  status: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED';
  completedSteps: number[];
}

export interface StepProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onToggle: (name: string, checked: boolean) => void;
  onArrayFieldChange?: (field: string, index: number, value: string) => void;
  onAddArrayFieldItem?: (field: string, defaultValue: string) => void;
  onRemoveArrayFieldItem?: (field: string, index: number) => void;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: Record<string, string>;
}
