import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CourseForm } from '..';
import { CourseFormProvider } from '@/context/CourseFormContext';

// Mock next/navigation
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
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

// Mock fetch
global.fetch = jest.fn();

describe('CourseForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  const renderForm = () => {
    render(
      <CourseFormProvider onSuccess={mockOnSuccess} onError={mockOnError}>
        <CourseForm />
      </CourseFormProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first step by default', () => {
    renderForm();
    expect(screen.getByLabelText('Course Title *')).toBeInTheDocument();
    expect(screen.getByLabelText('Short Description *')).toBeInTheDocument();
    expect(screen.getByText('Basic Info')).toHaveClass('font-medium');
  });

  it('allows navigation between steps', async () => {
    renderForm();
    
    // Click next
    fireEvent.click(screen.getByText('Next'));
    
    // Should be on step 2 (Media)
    await waitFor(() => {
      expect(screen.getByText('Media')).toHaveClass('font-medium');
    });
    
    // Click back
    fireEvent.click(screen.getByText('Back'));
    
    // Should be back on step 1
    await waitFor(() => {
      expect(screen.getByText('Basic Info')).toHaveClass('font-medium');
    });
  });

  it('shows loading state when submitting', async () => {
    // Mock the fetch API
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '123' }),
    });

    renderForm();
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Course Title *'), {
      target: { value: 'Test Course' },
    });
    
    fireEvent.change(screen.getByLabelText('Short Description *'), {
      target: { value: 'Test description' },
    });
    
    // Navigate to last step
    fireEvent.click(screen.getByText('Next')); // Step 2
    fireEvent.click(screen.getByText('Next')); // Step 3
    fireEvent.click(screen.getByText('Next')); // Step 4
    
    // Submit form
    fireEvent.click(screen.getByText('Publish Course'));
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /publish/i })).toBeDisabled();
    });
    
    // Should call onSuccess with course ID
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('123');
    });
  });

  it('handles form submission errors', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Validation failed' }),
    });

    renderForm();
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Course Title *'), {
      target: { value: 'Test Course' },
    });
    
    fireEvent.change(screen.getByLabelText('Short Description *'), {
      target: { value: 'Test description' },
    });
    
    // Navigate to last step and submit
    fireEvent.click(screen.getByText('Next')); // Step 2
    fireEvent.click(screen.getByText('Next')); // Step 3
    fireEvent.click(screen.getByText('Next')); // Step 4
    fireEvent.click(screen.getByText('Publish Course'));
    
    // Should call onError with the error
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
  });
});
