# Course Creation Components

This directory contains the components and context for the course creation and editing flow.

## Components

### CourseForm

The main form component that orchestrates the multi-step course creation process.

### Form Steps

1. **BasicInfoStep** - Collects basic course information (title, description, category, level, language)
2. **MediaStep** - Handles course image and promo video uploads
3. **StructureStep** - Manages course requirements, learning outcomes, and target audience
4. **FinalStep** - Final review and publish settings

### FormNavigation

Handles navigation between form steps, including back/next buttons and draft saving/loading.

## Context

### CourseFormContext

Manages the form state, validation, and submission logic. Provides the following:

- Form state management
- Field validation
- Multi-step navigation
- Draft saving/loading
- Form submission
- Error handling

## Usage

```tsx
import { CourseFormProvider, CourseForm } from '@/components/course';

export default function CreateCoursePage() {
  const handleSuccess = (courseId: string) => {
    // Handle successful course creation
  };

  const handleError = (error: Error) => {
    // Handle form submission error
  };

  return (
    <CourseFormProvider onSuccess={handleSuccess} onError={handleError}>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Create New Course</h1>
        <CourseForm />
      </div>
    </CourseFormProvider>
  );
}
```

## Form Data Structure

The form data follows this structure:

```typescript
interface FormData {
  // Basic Information
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  
  // Media
  imageFile: File | null;
  imagePreview: string;
  promoVideoUrl: string;
  
  // Structure
  requirements: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  
  // Settings
  isPublished: boolean;
  isPrivate: boolean;
}
```

## Validation

Form validation is handled using Zod schemas. The validation rules are defined in `@/validations/course.ts`.

## Error Handling

Form errors are displayed inline with the relevant form fields. The form also includes error boundaries to catch and display any unexpected errors.

## Testing

Unit tests for form components and context are located in the `__tests__` directory.
