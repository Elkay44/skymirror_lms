'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, Plus, Send, Reply, Heart, Smile, 
  MoreHorizontal, Pin, CheckCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

// Mock types for discussions - in a real app, these would come from your API types
interface Discussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  isPinned: boolean;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  lastActivity: string;
}

interface DiscussionComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  createdAt: string;
  likes: number;
  isInstructorResponse: boolean;
}

interface ModuleDiscussionsProps {
  courseId: string;
  moduleId: string;
}

export function ModuleDiscussions({ courseId, moduleId }: ModuleDiscussionsProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [activeDiscussion, setActiveDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newDiscussionOpen, setNewDiscussionOpen] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // In a real app, fetch discussions from API
    // For now, using mock data
    setTimeout(() => {
      const mockDiscussions: Discussion[] = [
        {
          id: '1',
          title: 'Question about the module assignment',
          content: 'I\'m having trouble understanding the requirements for the final project. Can someone clarify what\'s expected?',
          authorId: '101',
          authorName: 'Alex Johnson',
          authorImage: '',
          isPinned: true,
          isResolved: false,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          commentCount: 3,
          lastActivity: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: '2',
          title: 'Error in code example on slide 15',
          content: 'I think there\'s a mistake in the React component example shown on slide 15. The props aren\'t being handled correctly.',
          authorId: '102',
          authorName: 'Sarah Miller',
          authorImage: '',
          isPinned: false,
          isResolved: true,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
          commentCount: 5,
          lastActivity: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
        {
          id: '3',
          title: 'Additional resources for TypeScript section',
          content: 'Are there any recommended additional resources for the TypeScript section? I\'d like to dive deeper into generic types.',
          authorId: '103',
          authorName: 'Michael Lee',
          authorImage: '',
          isPinned: false,
          isResolved: false,
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          commentCount: 1,
          lastActivity: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
      ];
      setDiscussions(mockDiscussions);
      setIsLoading(false);
    }, 1000);
  }, [courseId, moduleId]);

  const loadDiscussionComments = (discussionId: string) => {
    setIsLoading(true);
    // In a real app, fetch comments from API
    setTimeout(() => {
      const mockComments: DiscussionComment[] = [
        {
          id: '101',
          content: 'The final project requires you to build a full-stack application using the technologies covered in the module. You should implement authentication, database integration, and at least one advanced feature of your choice.',
          authorId: '999',
          authorName: 'Professor Wilson',
          authorImage: '',
          createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
          likes: 3,
          isInstructorResponse: true,
        },
        {
          id: '102',
          content: 'Thanks for the clarification. Does it need to include tests as well?',
          authorId: '101',
          authorName: 'Alex Johnson',
          authorImage: '',
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          likes: 0,
          isInstructorResponse: false,
        },
        {
          id: '103',
          content: 'Yes, please include unit tests for the key functionality. Integration tests are optional but recommended.',
          authorId: '999',
          authorName: 'Professor Wilson',
          authorImage: '',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          likes: 2,
          isInstructorResponse: true,
        },
      ];
      setComments(mockComments);
      setIsLoading(false);
    }, 800);
  };

  const handleViewDiscussion = (discussion: Discussion) => {
    setActiveDiscussion(discussion);
    loadDiscussionComments(discussion.id);
  };

  const handleCreateDiscussion = () => {
    if (!newDiscussionTitle.trim() || !newDiscussionContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // In a real app, send to API
    const newDiscussion: Discussion = {
      id: `new-${Date.now()}`,
      title: newDiscussionTitle,
      content: newDiscussionContent,
      authorId: '999', // Instructor ID
      authorName: 'Professor Wilson', // Instructor name
      authorImage: '',
      isPinned: false,
      isResolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commentCount: 0,
      lastActivity: new Date().toISOString(),
    };

    setDiscussions([newDiscussion, ...discussions]);
    setNewDiscussionTitle('');
    setNewDiscussionContent('');
    setNewDiscussionOpen(false);
    toast.success('Discussion created successfully');
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !activeDiscussion) return;

    // In a real app, send to API
    const comment: DiscussionComment = {
      id: `new-comment-${Date.now()}`,
      content: newComment,
      authorId: '999', // Instructor ID
      authorName: 'Professor Wilson', // Instructor name
      authorImage: '',
      createdAt: new Date().toISOString(),
      likes: 0,
      isInstructorResponse: true,
    };

    setComments([...comments, comment]);
    
    // Update discussion
    const updatedDiscussions = discussions.map(d => 
      d.id === activeDiscussion.id 
        ? {
            ...d,
            commentCount: d.commentCount + 1,
            lastActivity: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : d
    );
    
    setDiscussions(updatedDiscussions);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleToggleResolved = (discussion: Discussion) => {
    const updatedDiscussions = discussions.map(d => 
      d.id === discussion.id 
        ? { ...d, isResolved: !d.isResolved }
        : d
    );
    setDiscussions(updatedDiscussions);
    
    if (activeDiscussion?.id === discussion.id) {
      setActiveDiscussion({ ...activeDiscussion, isResolved: !activeDiscussion.isResolved });
    }
    
    toast.success(`Discussion marked as ${discussion.isResolved ? 'unresolved' : 'resolved'}`);
  };

  const handleTogglePinned = (discussion: Discussion) => {
    const updatedDiscussions = discussions.map(d => 
      d.id === discussion.id 
        ? { ...d, isPinned: !d.isPinned }
        : d
    );
    setDiscussions(updatedDiscussions);
    
    if (activeDiscussion?.id === discussion.id) {
      setActiveDiscussion({ ...activeDiscussion, isPinned: !activeDiscussion.isPinned });
    }
    
    toast.success(`Discussion ${discussion.isPinned ? 'unpinned' : 'pinned'}`);
  };

  const filteredDiscussions = discussions.filter(d => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pinned') return d.isPinned;
    if (activeTab === 'resolved') return d.isResolved;
    if (activeTab === 'unresolved') return !d.isResolved;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Module Discussions</h2>
          <p className="text-muted-foreground">
            Engage with students and address questions related to this module.
          </p>
        </div>
        <Button onClick={() => setNewDiscussionOpen(true)}>
          <Plus size={16} className="mr-2" />
          New Discussion
        </Button>
      </div>

      {/* Tabs for filtering discussions */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">
            All <Badge variant="secondary" className="ml-2">{discussions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pinned">
            Pinned <Badge variant="secondary" className="ml-2">{discussions.filter(d => d.isPinned).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved <Badge variant="secondary" className="ml-2">{discussions.filter(d => d.isResolved).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unresolved">
            Unresolved <Badge variant="secondary" className="ml-2">{discussions.filter(d => !d.isResolved).length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Discussions list */}
            <div className="md:col-span-2 space-y-2 max-h-[700px] overflow-auto pr-2">
              {isLoading && !activeDiscussion ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredDiscussions.length > 0 ? (
                filteredDiscussions.map((discussion) => (
                  <Card 
                    key={discussion.id} 
                    className={`cursor-pointer transition-all ${activeDiscussion?.id === discussion.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                    onClick={() => handleViewDiscussion(discussion)}
                  >
                    <CardHeader className="py-3">
                      <div className="flex justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={discussion.authorImage || ''} />
                            <AvatarFallback>{discussion.authorName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{discussion.authorName}</span>
                        </div>
                        <div className="flex space-x-1">
                          {discussion.isPinned && <Pin size={14} className="text-amber-500" />}
                          {discussion.isResolved && <CheckCircle size={14} className="text-emerald-500" />}
                        </div>
                      </div>
                      <div className="mt-1">
                        <h3 className="text-base font-medium">{discussion.title}</h3>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <MessageCircle size={14} className="mr-1" />
                          <span>{discussion.commentCount}</span>
                          <span className="mx-2">•</span>
                          <span>
                            {new Date(discussion.lastActivity).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No discussions found.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setNewDiscussionOpen(true)}
                  >
                    Create a new discussion
                  </Button>
                </div>
              )}
            </div>

            {/* Discussion detail */}
            <div className="md:col-span-3">
              {activeDiscussion ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          {activeDiscussion.isPinned && (
                            <Badge variant="secondary" className="text-amber-500 border-amber-200 bg-amber-50">
                              <Pin size={12} className="mr-1" /> Pinned
                            </Badge>
                          )}
                          {activeDiscussion.isResolved ? (
                            <Badge variant="secondary" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                              <CheckCircle size={12} className="mr-1" /> Resolved
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-orange-600 border-orange-200 bg-orange-50">
                              <AlertCircle size={12} className="mr-1" /> Unresolved
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-xl font-semibold">{activeDiscussion.title}</h2>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent sideOffset={8} className="w-56">
                          <DropdownMenuItem onClick={() => handleTogglePinned(activeDiscussion)}>
                            <Pin size={16} className="mr-2" />
                            {activeDiscussion.isPinned ? 'Unpin Discussion' : 'Pin Discussion'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleResolved(activeDiscussion)}>
                            <CheckCircle size={16} className="mr-2" />
                            {activeDiscussion.isResolved ? 'Mark Unresolved' : 'Mark Resolved'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-5">
                      {/* Original post */}
                      <div className="p-4 bg-muted/30 rounded-md">
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={activeDiscussion.authorImage || ''} />
                            <AvatarFallback>{activeDiscussion.authorName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{activeDiscussion.authorName}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(activeDiscussion.createdAt), 'MMM d, yyyy • h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm prose prose-sm max-w-none">
                          {activeDiscussion.content}
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="space-y-5">
                        <h3 className="font-medium text-sm text-muted-foreground">
                          {comments.length} {comments.length === 1 ? 'Response' : 'Responses'}
                        </h3>
                        
                        {isLoading ? (
                          <div className="flex justify-center py-6">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                          </div>
                        ) : (
                          <div className="space-y-5">
                            {comments.map((comment) => (
                              <div key={comment.id} className="flex gap-4">
                                <Avatar className="h-8 w-8 mt-0.5">
                                  <AvatarImage src={comment.authorImage || ''} />
                                  <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-muted/30 p-3 rounded-md">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{comment.authorName}</span>
                                        {comment.isInstructorResponse && (
                                          <Badge variant="secondary" className="text-primary">Instructor</Badge>
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(comment.createdAt), 'MMM d • h:mm a')}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-sm">
                                      {comment.content}
                                    </div>
                                  </div>
                                  <div className="flex items-center mt-1 space-x-4 text-xs">
                                    <button className="flex items-center text-muted-foreground hover:text-foreground">
                                      <Heart size={14} className="mr-1" />
                                      <span>{comment.likes}</span>
                                    </button>
                                    <button className="flex items-center text-muted-foreground hover:text-foreground">
                                      <Reply size={14} className="mr-1" />
                                      <span>Reply</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="flex space-x-2 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>PW</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex">
                        <Input 
                          placeholder="Add your response..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="rounded-r-none"
                        />
                        <Button 
                          className="rounded-l-none"
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                        >
                          <Send size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <div className="flex flex-col justify-center items-center h-[400px] border border-dashed rounded-lg">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Select a discussion to view</p>
                  <p className="text-xs text-muted-foreground max-w-md text-center">
                    Click on a discussion from the list on the left to view its details and responses
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Discussion Dialog */}
      <Dialog open={newDiscussionOpen} onOpenChange={setNewDiscussionOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create a New Discussion</DialogTitle>
            <DialogDescription>
              Start a new discussion topic for this module. Be clear and specific in your question or prompt.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a descriptive title"
                value={newDiscussionTitle}
                onChange={(e) => setNewDiscussionTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Provide details about your discussion topic..."
                rows={5}
                value={newDiscussionContent}
                onChange={(e) => setNewDiscussionContent(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDiscussionOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDiscussion}>Create Discussion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
