/**
 * Type definitions for forum-related models
 * These types help with TypeScript validation when working with forum data
 */

// Forum post interface
export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  forumId: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  isLocked?: boolean;
  viewCount?: number;
  author?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  likes?: ForumPostLike[];
  comments?: ForumPostComment[];
  _count?: {
    likes: number;
    comments: number;
  };
}

// Forum interface
export interface Forum {
  id: string;
  title: string;
  description: string;
  courseId: string;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
  posts?: ForumPost[];
  _count?: {
    posts: number;
  };
}

// Forum post like interface
export interface ForumPostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
}

// Forum post comment interface
export interface ForumPostComment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    name: string;
    image?: string;
  };
}
