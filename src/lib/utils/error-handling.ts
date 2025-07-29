/**
 * Type guard to check if an error is an Axios error
 * @param error The error to check
 * @returns boolean indicating if the error is an Axios error
 */
export function isAxiosError(error: unknown): error is { 
  isAxiosError: boolean; 
  response?: { 
    data?: any;
    status?: number;
    headers?: any;
  };
  request?: any;
  config?: any;
} {
  return (
    typeof error === 'object' && 
    error !== null && 
    'isAxiosError' in error && 
    (error as any).isAxiosError === true
  );
}

/**
 * Extracts error message from an unknown error
 * @param error The error to extract message from
 * @returns A user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const responseData = error.response?.data;
    if (responseData) {
      if (typeof responseData === 'object') {
        return [
          responseData.error,
          responseData.message,
          responseData.details,
          'An unexpected error occurred'
        ].find(Boolean) || 'An unexpected error occurred';
      }
      return String(responseData);
    }
    // Check if error has a message property
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Network error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}
