"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

import { ArrowLeft, MessageSquare, Pin, Clock, ThumbsUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

interface ForumComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  parentCommentId?: string;
  likes: number;
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const forumId = params.forumId as string;
  const postId = params.postId as string;

  useEffect(() => {
    // Function to fetch post and comments
    const fetchPostAndComments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch post details
        const postRes = await fetch(`/api/courses/${courseId}/modules/${moduleId}/forums/${forumId}/posts/${postId}`);
        
        if (!postRes.ok) {
          throw new Error(`Failed to fetch post: ${postRes.status}`);
        }
        
        const postData = await postRes.json();
        setPost(postData);
        
        // Fetch comments
        const commentsRes = await fetch(`/api/courses/${courseId}/modules/${moduleId}/forums/${forumId}/posts/${postId}/comments`);
        
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData.comments || []);
        }
      } catch (err) {
        console.error("Error fetching post data:", err);
        setError(err instanceof Error ? err.message : "Failed to load post");
        toast({
          title: "Error",
          description: "Failed to load post data. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (courseId && moduleId && forumId && postId) {
      fetchPostAndComments();
    }
  }, [courseId, moduleId, forumId, postId, toast]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (commentContent.trim().length < 3) {
      toast({
        title: "Validation Error",
        description: "Comment must be at least 3 characters long"
      });
      return;
    }
    
    try {
      setCommentLoading(true);
      
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/forums/${forumId}/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: commentContent,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post comment");
      }
      
      const newComment = await response.json();
      
      // Add the new comment to the list
      setComments((prevComments) => [...prevComments, newComment]);
      setCommentContent("");
      
      toast({
        title: "Success",
        description: "Comment posted successfully"
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to post comment"
      });
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-[300px]" />
        </div>
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="container py-6 flex flex-col items-center justify-center min-h-[600px]">
        <p className="text-destructive mb-4">{error || "Post not found"}</p>
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forums/${forumId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forum
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">{post.title}</h1>
          <div className="flex items-center gap-2">
            {post.isPinned && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Pinned
              </Badge>
            )}
            {post.isLocked && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar>
            <AvatarImage src={post.author.image || ""} alt={post.author.name || "User"} />
            <AvatarFallback>{post.author.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">{post.author.name}</h2>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(post.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <ThumbsUp className="h-4 w-4 mr-1" />
              {post._count.likes} likes
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              {post._count.comments} comments
            </div>
          </div>
          <div>
            {post.viewCount} views
          </div>
        </CardFooter>
      </Card>
      
      <Separator className="my-8" />
      
      <div>
        <h2 className="text-xl font-bold mb-6">Comments ({comments.length})</h2>
        
        {!post.isLocked && (
          <form onSubmit={handleSubmitComment} className="mb-8">
            <Textarea
              placeholder="Write a comment..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              disabled={commentLoading}
              className="mb-2 min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={commentLoading}>
                {commentLoading ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        )}
        
        {post.isLocked && (
          <div className="bg-muted p-4 rounded-md mb-8 flex items-center justify-center">
            <Lock className="h-4 w-4 mr-2" />
            <p>This post is locked. New comments cannot be added.</p>
          </div>
        )}
        
        {comments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.image || ""} alt={comment.author.name || "User"} />
                    <AvatarFallback>{comment.author.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm">{comment.author.name}</h3>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p>{comment.content}</p>
                </CardContent>
                <CardFooter className="pt-0 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    {comment.likes || 0} likes
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
