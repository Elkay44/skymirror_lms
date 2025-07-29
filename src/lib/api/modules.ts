import { Module, CreateModuleRequest, UpdateModuleRequest, ModuleListResponse } from '@/types/module';

const API_BASE_URL = '/api/courses';

// Helper function to safely parse JSON responses
async function safeParseJSON(response: Response): Promise<any> {
  const text = await response.text();
  
  // If the response is empty, return an empty object or array as appropriate
  if (!text || text.trim() === '') {
    return {};
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    console.error('Response text:', text);
    throw new Error('Invalid JSON response from server');
  }
}

export async function getModules(courseId: string): Promise<Module[]> {
  if (!courseId) {
    const error = new Error('Course ID is required');
    error.name = 'InvalidCourseIdError';
    console.error('[getModules] No course ID provided');
    throw error;
  }
  
  // Validate courseId is not empty
  if (typeof courseId !== 'string' || courseId.trim() === '') {
    const error = new Error('Course ID must be a non-empty string');
    error.name = 'InvalidCourseIdError';
    console.error(`[getModules] Invalid course ID: ${courseId}`);
    throw error;
  }
  
  // Add timestamp to prevent browser caching
  const timestamp = new Date().getTime();
  const url = `${API_BASE_URL}/${courseId}/modules?t=${timestamp}`;
  
  console.log(`[getModules] Fetching modules from: ${url}`);
  console.log(`[getModules] Course ID: ${courseId} (type: ${typeof courseId})`);
  
  try {
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Accept': 'application/json'
      }
    });
    
    console.log(`[getModules] Response status: ${response.status}`);
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.log(`[getModules] Error response:`, errorText);
        
        // Try to parse as JSON if possible
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            console.log('[getModules] Parsed error data:', errorData);
          } catch (e) {
            console.log('[getModules] Could not parse error response as JSON');
          }
        }
      } catch (e) {
        console.error('[getModules] Error reading error response:', e);
      }
      
      if (response.status === 404) {
        const error = new Error('Course not found');
        error.name = 'CourseNotFoundError';
        throw error;
      }
      
      const error = new Error(
        errorText || `Failed to fetch modules: ${response.status} - ${response.statusText}`
      );
      error.name = 'ModuleFetchError';
      throw error;
    }
    
    const data = await safeParseJSON(response);
    console.log(`[getModules] Received ${data?.data?.length || 0} modules from server`);
    console.log('[getModules] Modules data:', data);
    
    if (!data || !Array.isArray(data.data)) {
      console.error('[getModules] Invalid response format, expected array of modules');
      return [];
    }
    
    return data.data;
  } catch (error: unknown) {
    console.error('[getModules] Error:', error);
    
    // Check if it's one of our known error types
    if (error instanceof Error) {
      if (error.name === 'CourseNotFoundError' || error.name === 'ModuleFetchError') {
        throw error;
      }
    }
    
    // For other errors, wrap them in a generic error
    const genericError = new Error('Failed to fetch modules. Please try again.');
    genericError.name = 'ModuleFetchError';
    throw genericError;
  }
}

export async function getModule(courseId: string, moduleId: string): Promise<Module> {
  try {
    console.log(`Fetching module: /api/courses/${courseId}/modules/${moduleId}`);
    
    const response = await fetch(`${API_BASE_URL}/${courseId}/modules/${moduleId}`, {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Log response details for debugging
    console.log(`Module API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Module fetch error [${response.status}]:`, errorText);
      throw new Error(`Failed to fetch module: ${response.status}`);
    }
    
    const moduleData = await safeParseJSON(response);
    console.log("Module data retrieved:", moduleData);
    return moduleData;
  } catch (error) {
    console.error("Error in getModule:", error);
    throw new Error('Failed to fetch module');
  }
}

export async function createModule(courseId: string, moduleData: CreateModuleRequest): Promise<Module> {
  try {
    const response = await fetch(`${API_BASE_URL}/${courseId}/modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(moduleData),
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `Failed to create module: ${response.status}`;
      try {
        const errorData = await safeParseJSON(response);
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If we can't parse the error response, use the default message
      }
      throw new Error(errorMessage);
    }

    return await safeParseJSON(response);
  } catch (error) {
    console.error("Error in createModule:", error);
    throw error;
  }
}

export async function updateModule(
  courseId: string,
  moduleId: string,
  updates: UpdateModuleRequest
): Promise<Module> {
  try {
    console.log(`Updating module: ${moduleId} with data:`, updates);
    
    const response = await fetch(`${API_BASE_URL}/${courseId}/modules/${moduleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
      credentials: 'include',
    });

    console.log(`Update response status: ${response.status}`);
    
    if (!response.ok) {
      // Safely handle the error response which might not be valid JSON
      let errorMessage = `Failed to update module: ${response.status}`;
      try {
        // Try to parse as JSON, but don't fail if it's not valid JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await safeParseJSON(response);
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } else {
          // If not JSON, try to get text content
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      
      throw new Error(errorMessage);
    }

    // First get the response as text
    const text = await response.text();
    console.log("Response text:", text ? "Not empty" : "Empty");
    
    // If there's no content, return an empty object
    if (!text || text.trim() === '') {
      console.log("Empty response, returning default module object");
      // Return the module with just the id and the updates applied
      return { 
        id: moduleId,
        ...updates,
        courseId: courseId,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Module;
    }
    
    try {
      // Try to parse the response as JSON
      return JSON.parse(text);
    } catch (jsonError) {
      console.error("Failed to parse response as JSON:", jsonError);
      console.error("Response text:", text);
      // Return a minimal object with the updates
      return { 
        id: moduleId,
        ...updates,
        courseId: courseId,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Module;
    }
  } catch (error) {
    console.error("Error in updateModule:", error);
    throw error;
  }
}

export async function deleteModule(courseId: string, moduleId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/${courseId}/modules/${moduleId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `Failed to delete module: ${response.status}`;
      try {
        const errorData = await safeParseJSON(response);
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If we can't parse the error response, use the default message
      }
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("Error in deleteModule:", error);
    throw error;
  }
}

export async function reorderModules(
  courseId: string,
  updates: Array<{ id: string; order: number }>
): Promise<void> {
  try {
    console.log(`Reordering modules for course ${courseId}:`, JSON.stringify(updates));
    
    // Use the new simplified API endpoint
    const response = await fetch('/api/modules/reorder', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        courseId,
        updates 
      }),
      credentials: 'include',
      cache: 'no-store'
    });
    
    console.log(`Reorder response status: ${response.status}`);
    
    if (!response.ok) {
      let errorMessage = `Failed to reorder modules: ${response.status}`;
      
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            if (errorData && errorData.error) {
              errorMessage = `${errorMessage} - ${errorData.error}`;
            }
          } catch (jsonError) {
            console.log('Error parsing JSON from response:', jsonError);
          }
        }
      } catch (textError) {
        console.log('Error reading response text:', textError);
      }
      
      throw new Error(errorMessage);
    }
    
    // Success - log the result
    const result = await response.json();
    console.log('Module reordering successful:', result);
  } catch (error) {
    console.error("Error in reorderModules:", error);
    throw error;
  }
}