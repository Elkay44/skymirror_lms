import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CourseFormProvider, useCourseForm } from '../CourseFormContext';
import '@testing-library/jest-dom';

// Mock FormData
const mockFormData = jest.fn(() => {
  const data: Record<string, any> = {};
  return {
    append: (key: string, value: any) => {
      data[key] = value;
    },
    get: (key: string) => data[key],
    getAll: () => Object.values(data),
    has: (key: string) => key in data,
    delete: (key: string) => {
      delete data[key];
    },
    forEach: (callback: (value: any, key: string) => void) => {
      Object.entries(data).forEach(([key, value]) => callback(value, key));
    },
  };
});

global.FormData = mockFormData as any;

// Mock next/navigation
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock window.URL.createObjectURL
const mockCreateObjectURL = jest.fn();
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
  },
  writable: true,
});



// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
declare const global: typeof globalThis & {
  fetch: jest.Mock;
};

global.fetch = jest.fn();

describe('CourseFormContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CourseFormProvider>{children}</CourseFormProvider>
  );

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('provides initial form state', () => {
    const { result } = renderHook(() => useCourseForm(), { wrapper });

    expect(result.current.formData).toEqual({
      title: '',
      shortDescription: '',
      description: '',
      category: '',
      level: 'beginner',
      language: 'en',
      imageFile: null,
      imagePreview: '',
      promoVideoUrl: '',
      requirements: [''],
      learningOutcomes: [''],
      targetAudience: [''],
      isPublished: false,
      isPrivate: false,
      price: 0,
      hasDiscount: false,
      discountedPrice: 0,
      isFree: false,
    });
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errors).toEqual({});
  });

  it('updates form data when handleChange is called', () => {
    const { result } = renderHook(() => useCourseForm(), { wrapper });

    act(() => {
      result.current.handleChange('title', 'Test Course');
    });

    expect(result.current.formData.title).toBe('Test Course');
  });

  it('navigates between steps', async () => {
    const { result } = renderHook(() => useCourseForm(), { wrapper });

    // Set required fields for step 1 validation
    await act(async () => {
      result.current.handleChange('title', 'Test Course');
      result.current.handleChange('shortDescription', 'Test description');
      result.current.handleChange('description', 'Test description');
      result.current.handleChange('category', 'programming');
      result.current.handleChange('level', 'beginner');
      result.current.handleChange('language', 'en');
      
      // First step validation should pass now
      result.current.nextStep();
    });
    
    expect(result.current.currentStep).toBe(2);

    // Set required fields for step 2 validation
    await act(async () => {
      result.current.handleChange('imagePreview', 'test.jpg');
      result.current.nextStep();
    });
    
    expect(result.current.currentStep).toBe(3);

    // Set required fields for step 3 validation
    await act(async () => {
      result.current.handleChange('requirements', ['Requirement 1']);
      result.current.handleChange('learningOutcomes', ['Outcome 1']);
      result.current.handleChange('targetAudience', ['Audience 1']);
      result.current.nextStep();
    });
    
    expect(result.current.currentStep).toBe(4);

    // Go back to previous step
    await act(async () => {
      result.current.prevStep();
    });
    
    expect(result.current.currentStep).toBe(3);

    // Go to first step
    await act(async () => {
      result.current.prevStep();
      result.current.prevStep();
    });
    
    expect(result.current.currentStep).toBe(1);
  });

  it('saves and loads drafts', async () => {
    const { result } = renderHook(() => useCourseForm(), { wrapper });

    // Update form data with all required fields
    await act(async () => {
      // Step 1 fields
      result.current.handleChange('title', 'Draft Course');
      result.current.handleChange('shortDescription', 'A draft course');
      result.current.handleChange('description', 'A detailed course description');
      result.current.handleChange('category', 'programming');
      result.current.handleChange('level', 'beginner');
      result.current.handleChange('language', 'en');
      
      // Move to step 2
      result.current.nextStep();
      
      // Step 2 fields
      result.current.handleChange('imagePreview', 'test.jpg');
      
      // Move to step 3
      result.current.nextStep();
      
      // Step 3 fields
      result.current.handleChange('requirements', ['Requirement 1']);
      result.current.handleChange('learningOutcomes', ['Outcome 1']);
      result.current.handleChange('targetAudience', ['Audience 1']);
      
      // Move to step 4
      result.current.nextStep();
      
      // Step 4 fields
      result.current.handleChange('isPublished', false);
      result.current.handleChange('isPrivate', false);
      
      // Save draft
      result.current.saveDraft();
    });

    // Get the saved draft from localStorage
    const draft = JSON.parse(localStorage.getItem('course_draft') || '{}');
    expect(draft.title).toBe('Draft Course');
    expect(draft.shortDescription).toBe('A draft course');
    expect(draft.requirements).toEqual(['Requirement 1']);
    expect(draft.currentStep).toBe(4);

    // Create a new instance of the form
    const { result: newResult } = renderHook(() => useCourseForm(), { wrapper });

    // Check if hasDraft is true
    expect(newResult.current.hasDraft).toBe(true);

    // Load draft
    await act(async () => {
      newResult.current.loadDraft();
    });

    // Check if form data was loaded from draft
    expect(newResult.current.formData.title).toBe('Draft Course');
    expect(newResult.current.formData.shortDescription).toBe('A draft course');
    expect(newResult.current.formData.requirements).toEqual(['Requirement 1']);
    expect(newResult.current.currentStep).toBe(4);
  });

  it('submits the form successfully', async () => {
    // Mock fetch with a simple implementation
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: '123' }),
    });
    global.fetch = mockFetch as jest.Mock;

    // Mock callbacks
    const mockOnSuccess = jest.fn();
    const mockOnError = jest.fn();

    // Create wrapper with providers
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CourseFormProvider 
        onSuccess={mockOnSuccess} 
        onError={mockOnError}
      >
        {children}
      </CourseFormProvider>
    );

    // Render the hook
    const { result } = renderHook(() => useCourseForm(), { wrapper });
    
    // Create a mock file
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
        
    // Set all required form fields
    await act(async () => {
      // Step 1 fields
      result.current.handleChange('title', 'Test Course');
      result.current.handleChange('shortDescription', 'Test description');
      result.current.handleChange('description', 'A test course');
      result.current.handleChange('category', 'programming');
      result.current.handleChange('level', 'beginner');
      result.current.handleChange('language', 'en');
      
      // Navigate to step 2
      result.current.nextStep();
      
      // Step 2 fields
      result.current.handleChange('imageFile', mockFile);
      result.current.handleChange('imagePreview', 'data:image/png;base64,test');
      
      // Navigate to step 3
      result.current.nextStep();
      
      // Step 3 fields
      result.current.handleChange('requirements', ['Requirement 1']);
      result.current.handleChange('learningOutcomes', ['Outcome 1']);
      result.current.handleChange('targetAudience', ['Audience 1']);
      
      // Navigate to step 4
      result.current.nextStep();
      
      // Step 4 fields
      result.current.handleChange('isPublished', false);
      result.current.handleChange('isPrivate', false);
      
      // Submit the form
      await result.current.submitForm();
    });

    // Check if fetch was called with the right data
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    // Verify fetch was called with the correct URL and method
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/courses/instructor');
    expect(options.method).toBe('POST');
    
    // Verify the body has FormData-like properties
    const formData = options.body;
    expect(formData).toBeDefined();
    expect(typeof formData.append).toBe('function');
    expect(typeof formData.get).toBe('function');
    
    // Check if success callback was called with the right arguments
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledWith('123');
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('handles form submission errors', async () => {
    // Save original fetch
    const originalFetch = global.fetch;
    
    // Mock fetch to return a failed response
    const errorMessage = 'Validation failed';
    const mockFetch = jest.fn().mockImplementation(async (url, options) => {
      console.log('Mock fetch called with:', { url, method: options?.method });
      return {
        ok: false,
        status: 400,
        json: async () => ({ message: errorMessage }),
      };
    });
    global.fetch = mockFetch as jest.Mock;

    // Create mock callbacks
    const mockOnError = jest.fn((error: Error) => {
      console.log('onError called with:', error);
    });
    const mockOnSuccess = jest.fn(() => {
      console.log('onSuccess called');
    });

    // Setup test component
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CourseFormProvider 
        onError={mockOnError}
        onSuccess={mockOnSuccess}
      >
        {children}
      </CourseFormProvider>
    );

    // Render the hook
    const { result } = renderHook(() => useCourseForm(), { wrapper });
    
    // Create a mock file
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    
    // Set form data
    await act(async () => {
      // Set basic course info
      result.current.handleChange('title', 'Test Course');
      result.current.handleChange('shortDescription', 'Test description');
      result.current.handleChange('description', 'A test course');
      result.current.handleChange('category', 'programming');
      result.current.handleChange('level', 'beginner');
      result.current.handleChange('language', 'en');
      
      // Set image file and preview
      result.current.handleChange('imageFile', mockFile);
      result.current.handleChange('imagePreview', 'data:image/png;base64,test');
      
      // Set course settings
      result.current.handleChange('isPublished', false);
      result.current.handleChange('isPrivate', false);
    });
    
    // Navigate to the final step (4)
    // We need to call nextStep multiple times to reach step 4
    // since the form starts at step 1
    await act(async () => {
      for (let i = 0; i < 3; i++) {
        result.current.nextStep();
      }
    });
    
    // Log the current step before submission
    console.log('Current step before submission:', result.current.currentStep);
    
    // Verify we're on the final step
    expect(result.current.currentStep).toBe(4);
    
    // Submit the form
    await act(async () => {
      await result.current.submitForm();
    });
    
    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/courses/instructor');
    expect(options.method).toBe('POST');
    
    // Check if body is FormData (or our mock FormData)
    const body = options.body;
    expect(body).toBeDefined();
    expect(typeof body.append).toBe('function');
    expect(typeof body.get).toBe('function');
    
    // Verify error callback was called with the error
    expect(mockOnError).toHaveBeenCalledTimes(1);
    const errorArg = mockOnError.mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(Error);
    expect(errorArg.message).toContain(errorMessage);
    
    // Verify success callback was not called
    expect(mockOnSuccess).not.toHaveBeenCalled();
    
    // Cleanup
    global.fetch = originalFetch;
  });
});
