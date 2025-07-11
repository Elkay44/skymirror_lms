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
  try {
    const response = await fetch(`${API_BASE_URL}/${courseId}/modules`, {
      // Include credentials to ensure the session cookie is sent
      credentials: 'include',
      cache: 'no-store',
    });
    
    if (!response.ok) {
      // Log more detailed error information
      const errorText = await response.text();
      console.error('Module fetch error:', response.status, errorText);
      throw new Error(`Failed to fetch modules: ${response.status}`);
    }
    
    const data = await safeParseJSON(response);
    return data.data || [];
  } catch (error) {
    console.error('Error in getModules:', error);
    throw error;
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
    const response = await fetch(`${API_BASE_URL}/${courseId}/modules/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `Failed to reorder modules: ${response.status}`;
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
    console.error("Error in reorderModules:", error);
    throw error;
  }
}