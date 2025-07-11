import { 
  ModulePage, 
  CreateModulePageRequest, 
  UpdateModulePageRequest,
  GetModulePagesResponse,
  ContentBlock,
  UpdateContentBlockRequest,
  ReorderPagesRequest,
  ReorderContentBlocksRequest
} from '@/types/module';

const API_BASE_URL = '/api/courses';

export async function getModulePages(courseId: string, moduleId: string): Promise<GetModulePagesResponse> {
  const response = await fetch(`${API_BASE_URL}/${courseId}/modules/${moduleId}/pages`);
  if (!response.ok) {
    throw new Error('Failed to fetch module pages');
  }
  return response.json();
}

export async function getModulePage(courseId: string, moduleId: string, pageId: string): Promise<ModulePage> {
  const response = await fetch(`${API_BASE_URL}/${courseId}/modules/${moduleId}/pages/${pageId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch module page');
  }
  return response.json();
}

export async function createModulePage(
  courseId: string, 
  moduleId: string, 
  pageData: CreateModulePageRequest
): Promise<ModulePage> {
  const response = await fetch(`${API_BASE_URL}/${courseId}/modules/${moduleId}/pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pageData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create module page');
  }

  return response.json();
}

export async function updateModulePage(
  courseId: string,
  moduleId: string,
  pageId: string,
  updates: UpdateModulePageRequest
): Promise<ModulePage> {
  const response = await fetch(`${API_BASE_URL}/${courseId}/modules/${moduleId}/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update module page');
  }

  return response.json();
}

export async function deleteModulePage(
  courseId: string,
  moduleId: string,
  pageId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${courseId}/modules/${moduleId}/pages/${pageId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete module page');
  }
}

export async function reorderModulePages(
  courseId: string,
  moduleId: string,
  updates: ReorderPagesRequest
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${courseId}/modules/${moduleId}/pages/reorder`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reorder module pages');
  }
}

export async function createContentBlock(
  courseId: string,
  moduleId: string,
  pageId: string,
  blockData: any // Using any here since we'll validate in the component
): Promise<ContentBlock> {
  const response = await fetch(
    `${API_BASE_URL}/${courseId}/modules/${moduleId}/pages/${pageId}/blocks`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blockData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create content block');
  }

  return response.json();
}

export async function updateContentBlock(
  courseId: string,
  moduleId: string,
  pageId: string,
  blockId: string,
  updates: UpdateContentBlockRequest
): Promise<ContentBlock> {
  const response = await fetch(
    `${API_BASE_URL}/${courseId}/modules/${moduleId}/pages/${pageId}/blocks/${blockId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates.data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update content block');
  }

  return response.json();
}

export async function deleteContentBlock(
  courseId: string,
  moduleId: string,
  pageId: string,
  blockId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/${courseId}/modules/${moduleId}/pages/${pageId}/blocks/${blockId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete content block');
  }
}

export async function reorderContentBlocks(
  courseId: string,
  moduleId: string,
  pageId: string,
  updates: ReorderContentBlocksRequest
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/${courseId}/modules/${moduleId}/pages/${pageId}/blocks/reorder`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reorder content blocks');
  }
}
