import { ContentBlock } from '@/types/module';
import { fetcher } from '../fetcher';

interface UpdateBlockOrdersRequest {
  blocks: { id: string; order: number }[];
}

/**
 * Updates the order of multiple content blocks
 */
export const updateContentBlockOrders = async (
  courseId: string,
  moduleId: string,
  pageId: string,
  blocksWithOrder: { id: string; order: number }[]
): Promise<{ success: boolean }> => {
  const response = await fetcher.put(
    `/api/courses/${courseId}/modules/${moduleId}/pages/${pageId}/blocks/reorder`,
    {
      blocks: blocksWithOrder
    }
  );
  return response;
};

/**
 * Gets a single content block by ID
 */
export const getContentBlock = async (
  courseId: string,
  moduleId: string,
  pageId: string,
  blockId: string
): Promise<ContentBlock> => {
  const response = await fetcher.get(
    `/api/courses/${courseId}/modules/${moduleId}/pages/${pageId}/blocks/${blockId}`
  );
  return response.data;
};
