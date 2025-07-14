/**
 * Types for forum system
 */

// Forum Topic - Main container for discussions within a module
export interface ForumTopic {
  id: string;
  title: string;
  description: string | null;
  isPinned: boolean;
  isLocked: boolean;
  moduleId: string;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  postCount: number;
  lastActivity: Date | null;
  posts?: ForumPost[];
}

// Request to create a forum topic
export interface CreateForumTopicRequest {
  title: string;
  description?: string;
  isPinned?: boolean;
}

// Post types
export type ForumPostType = 'DISCUSSION' | 'QUESTION' | 'ANNOUNCEMENT';

// Forum post structure
export interface ForumPost {
  id: string;
  title: string;
  content: string;
  type: ForumPostType;
  pinned: boolean;
  resolved: boolean;
  tagList: string[];
  attachments: ForumAttachment[];
  views: number;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  courseId: string;
}

// Forum comment structure
export interface ForumComment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  postId: string;
  parentId?: string | null;
  isAnswer: boolean;
  attachments: ForumAttachment[];
}

// Forum attachment
export interface ForumAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

// Request to create a forum post
export interface CreateForumPostRequest {
  title: string;
  content: string;
  isPinned?: boolean;
  isQuestion?: boolean;
  tags?: string[];
  allowComments?: boolean;
  attachments?: ForumAttachment[];
}

// Request to filter forum posts
export interface FilterForumPostsRequest {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'commentCount' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
  filter?: 'all' | 'announcements' | 'questions' | 'pinned' | 'mine' | 'unanswered' | 'popular';
  tag?: string;
  search?: string;
}

// Forum post view record
export interface ForumPostView {
  id: string;
  postId: string;
  userId: number;
  viewedAt: Date;
}

// Forum post like record
export interface ForumPostLike {
  id: string;
  postId: string;
  userId: number;
  createdAt: Date;
}

// Response for listing forum posts
export interface ListForumPostsResponse {
  posts: ForumPostDto[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    filter: string;
    tag?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  };
  metadata: {
    topTags: {
      name: string;
      count: number;
    }[];
    totalPosts: number;
    totalComments: number;
    unansweredQuestions: number;
    engagement: string;
  };
}

// Data transfer object for forum posts
export interface ForumPostDto {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  type: ForumPostType;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    name: string;
    image?: string;
    role?: string;
  };
  tagList: string[];
  attachments: ForumAttachment[];
  views: number;
  commentCount: number;
  likeCount: number;
  userLiked?: boolean;
  previewComments?: {
    id: string;
    content: string;
    createdAt: Date;
    author: {
      id: number;
      name: string;
      image?: string;
    };
  }[];
}
