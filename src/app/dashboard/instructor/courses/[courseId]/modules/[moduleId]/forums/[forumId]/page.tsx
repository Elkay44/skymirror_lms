"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, ArrowLeft, MessageSquare, Clock, ThumbsUp, Eye, PinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast"; // Import from the correct path
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Define types for the component
interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  forumId: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isLocked?: boolean;
  viewCount?: number;
  author?: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

export default function ModuleForumPostsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forum, setForum] = useState<any>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const forumId = params.forumId as string;

  useEffect(() => {
    const fetchForum = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the forum details
        const forumRes = await fetch(`/api/courses/${courseId}/modules/${moduleId}/forums/${forumId}`);
        
        if (!forumRes.ok) {
          throw new Error(`Failed to fetch forum: ${forumRes.status}`);
        }
        
        const forumData = await forumRes.json();
        setForum(forumData);
        
        // Fetch the forum posts
        const postsRes = await fetch(`/api/courses/${courseId}/modules/${moduleId}/forums/${forumId}/posts`);
        
        if (!postsRes.ok) {
          throw new Error(`Failed to fetch posts: ${postsRes.status}`);
        }
        
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      } catch (err) {
        console.error("Error fetching forum data:", err);
        setError(err instanceof Error ? err.message : "Failed to load forum data");
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load forum data"
        });
      } finally {
        setLoading(false);
      }
    };

    if (courseId && moduleId && forumId) {
      fetchForum();
    }
  }, [courseId, moduleId, forumId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] min-w-0">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-muted-foreground">Loading forum posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] min-w-0">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] min-w-0">
        <p className="text-muted-foreground mb-4">Forum not found</p>
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6 min-w-0">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forums`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forums
          </Button>
          <h1 className="text-3xl font-bold mt-4 break-words">{forum.title}</h1>
          <p className="text-muted-foreground mt-1">{forum.description}</p>
        </div>
        <Button onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forums/${forumId}/posts/create`)}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      <Separator className="my-6" />

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-lg min-w-0">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2 break-words">No posts yet</h3>
          <p className="text-muted-foreground mb-6">Be the first to start a discussion in this forum</p>
          <Button onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forums/${forumId}/posts/create`)}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Post
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Link 
              href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forums/${forumId}/posts/${post.id}`}
              key={post.id}
            >
              <Card className="transition-all hover:border-primary hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start min-w-0">
                    <div>
                      <CardTitle className="flex items-center min-w-0">
                        {post.isPinned && (
                          <PinIcon className="h-4 w-4 text-primary mr-2" />
                        )}
                        {post.title}
                      </CardTitle>
                      {post.isLocked && (
                        <Badge variant="outline" className="ml-2">Locked</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="line-clamp-2 text-muted-foreground">
                    {post.content.replace(/<[^>]*>?/gm, '')}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 text-sm text-muted-foreground flex justify-between break-words min-w-0">
                  <div className="flex items-center min-w-0">
                    <p>By {post.author?.name || "Unknown"}</p>
                    <span className="mx-2">•</span>
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(post.createdAt), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="flex items-center min-w-0">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {post._count?.comments || 0}
                    </div>
                    <div className="flex items-center min-w-0">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {post._count?.likes || 0}
                    </div>
                    <div className="flex items-center min-w-0">
                      <Eye className="h-4 w-4 mr-1" />
                      {post.viewCount || 0}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
