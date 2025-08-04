"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Pin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import dynamic from 'next/dynamic';

// Import the Editor component dynamically to avoid SSR issues with browser-specific features
const Editor = dynamic(() => import('@/components/editor/Editor'), {
  ssr: false,
  loading: () => <div className="border rounded-md p-4">Loading editor...</div>,
});

export default function CreatePostPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const forumId = params.forumId as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      toast({
        title: "Validation Error",
        description: "Post title must be at least 3 characters long"
      });
      return;
    }

    if (content.trim().length < 10) {
      toast({
        title: "Validation Error",
        description: "Post content must be at least 10 characters long"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/forums/${forumId}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          isPinned,
          isLocked,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create post");
      }

      toast({
        title: "Success",
        description: "Post created successfully"
      });

      // Redirect back to the forum posts page
      router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forums/${forumId}`);
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6 min-w-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forums/${forumId}`)}
          className="mr-4"
        >
          <Pin className="mr-2 h-4 w-4" />
          Back to Forum
        </Button>
        <h1 className="text-2xl font-bold break-words">Create New Post</h1>
      </div>

      <Separator className="my-4" />

      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6 max-w-4xl">
        <div className="space-y-2">
          <Label htmlFor="title">Post Title</Label>
          <Input
            id="title"
            placeholder="Enter a descriptive title for your post"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            maxLength={255}
            className="w-full"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Post Content</Label>
          <div className="min-h-[300px] border rounded-md">
            <Editor
              value={content}
              onChange={(value) => setContent(value)}
              editable={true}
              placeholder="Write your post content here..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row min-w-0">
          <div className="flex items-center space-x-2 min-w-0">
            <Checkbox 
              id="isPinned" 
              checked={isPinned} 
              onCheckedChange={(checked) => setIsPinned(checked === true)} 
              disabled={isSubmitting}
            />
            <Label htmlFor="isPinned">Pin this post (appears at the top)</Label>
          </div>

          <div className="flex items-center space-x-2 min-w-0">
            <Checkbox 
              id="isLocked" 
              checked={isLocked} 
              onCheckedChange={(checked) => setIsLocked(checked === true)} 
              disabled={isSubmitting}
            />
            <Label htmlFor="isLocked">Lock this post (prevents comments)</Label>
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-4 min-w-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/forums/${forumId}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Post"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
