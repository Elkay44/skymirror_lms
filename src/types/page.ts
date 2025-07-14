export interface Page {
  id: string;
  title: string;
  description?: string;
  moduleId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  isPublished: boolean;
  order?: number;
}

export interface CreatePageRequest {
  title: string;
  description?: string;
  moduleId: string;
  isPublished?: boolean;
}

export interface UpdatePageRequest {
  title?: string;
  description?: string;
  isPublished?: boolean;
}

export interface PageSection {
  id: string;
  pageId: string;
  title: string;
  content: string;
  order: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreatePageSectionRequest {
  title: string;
  content: string;
  order?: number;
}

export interface UpdatePageSectionRequest {
  title?: string;
  content?: string;
  order?: number;
}
