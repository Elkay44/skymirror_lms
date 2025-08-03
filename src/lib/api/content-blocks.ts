import { ContentBlock } from '@/types/module';
import { fetcher } from '../fetcher';

/**
 * Updates the order of multiple content blocks
 */
export const updateContentBlockOrders = async (
  courseId: string,
  moduleId: string,
  pageId: string,
  blocksWithOrder: { id: string; order: number }[]
): Promise<{ success: boolean }> => {
  try {
    const response = await fetcher.put<{ success: boolean }>(
      `/api/courses/${courseId}/modules/${moduleId}/pages/${pageId}/blocks/reorder`,
      {
        blocks: blocksWithOrder
      }
    );
    return response || { success: false };
  } catch (error) {
    console.error('Error updating content block orders:', error);
    return { success: false };
  }
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
  return await fetcher.get<ContentBlock>(
    `/api/courses/${courseId}/modules/${moduleId}/pages/${pageId}/blocks/${blockId}`
  );
};
