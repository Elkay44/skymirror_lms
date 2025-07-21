export interface ProjectResource {
  id: string;
  projectId: string;
  title: string;
  url: string;
  type: 'LINK' | 'FILE' | 'VIDEO';
  order?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateProjectResourceRequest {
  projectId: string;
  title: string;
  url: string;
  type: 'LINK' | 'FILE' | 'VIDEO';
  order?: number;
}

export interface UpdateProjectResourceRequest {
  title?: string;
  url?: string;
  type?: 'LINK' | 'FILE' | 'VIDEO';
  order?: number;
}
