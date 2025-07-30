'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MessageSquare, Clock, Check, X, User, Star } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Mentor, fetchMentors, requestMentorship, fetchMyMentorships, cancelMentorshipRequest } from "@/services/mentorship";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toast } from 'sonner';

interface MentorshipRequest {
  id: string;
  mentor: {
    id: string;
    name: string;
    image?: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  requestedDate: Date | string;
  messages: Array<{
    id: string;
    sender: 'MENTOR' | 'STUDENT';
    content: string;
    timestamp: Date | string;
  }>;
  scheduledSessions?: Array<{
    id: string;
    date: Date | string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    meetingUrl?: string;
  }>;
  lastMessage?: {
    content: string;
    timestamp: Date | string;
    isRead: boolean;
  };
}

const getInitials = (name: string): string => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

interface MentorCardProps {
  mentor: Mentor;
  onRequest: (mentor: Mentor) => void;
  onMessage: (mentor: Mentor) => void;
}

const MentorCard: React.FC<MentorCardProps> = ({ mentor, onRequest, onMessage }) => {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{mentor.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{mentor.role || 'Mentor'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span>{(mentor.rating || 0).toFixed(1)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" />
          <span>Usually responds within 24 hours</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {mentor.bio || 'Experienced mentor with a passion for helping others grow.'}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => onMessage(mentor)}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Message
        </Button>
        <Button size="sm" onClick={() => onRequest(mentor)}>
          <User className="mr-2 h-4 w-4" />
          Request Session
        </Button>
      </CardFooter>
    </Card>
  );
};

interface RequestCardProps {
  request: MentorshipRequest & {
    mentor?: { name: string; image?: string };
  };
  onCancel: (id: string) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onCancel }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>{getInitials(request.mentor?.name || 'M')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{request.mentor?.name || 'Mentor'}</CardTitle>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[request.status as keyof typeof statusColors] || 'bg-gray-100'}`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>
          </div>
          {request.status === 'PENDING' && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(request.id)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {request.messages.length > 0 ? request.messages[0].content : 'No message provided'}
        </div>
      </CardContent>
    </Card>
  );
};

export default function MentorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [myMentorships, setMyMentorships] = useState<MentorshipRequest[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          toast({
            title: 'Error',
            description: 'You must be logged in to view mentors',
            type: 'destructive'
          });
          router.push('/login');
          return;
        }

        const mentorsData = await fetchMentors();
        setMentors(mentorsData);
        const requests = await fetchMyMentorships();
        setMentorshipRequests(requests);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          toast({
            title: 'Error',
            description: 'You must be logged in to view mentors',
            type: 'destructive'
          });
          router.push('/login');
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load mentors and requests',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast, router]);

  const filteredMentors = mentors.filter((mentor) => {
    if (!searchQuery) return true;
    return (
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mentor.specialties && mentor.specialties.split(',').some((specialty: string) => 
        specialty.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    );
  });

  const handleRequestMentorship = async (mentor: Mentor) => {
    try {
      // Get session and validate user
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        toast({
          title: 'Error',
          description: 'You must be logged in to request mentorship',
          type: 'destructive'
        });
        return;
      }

      // Default to a session 1 week from now at 2 PM
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      defaultDate.setHours(14, 0, 0, 0);

      await requestMentorship({
        mentorId: mentor.id,
        description: `I would like to request mentorship for ${mentor.role}`,
        title: `Mentorship Session with ${mentor.name}`,
        scheduledAt: defaultDate.toISOString(),
        duration: 60, // 60 minutes
        notes: `Mentorship request for ${mentor.role} role`,
        menteeId: session.user.id
      });
      
      toast({
        title: 'Mentorship Requested',
        description: `Your request has been sent to ${mentor.name}`,
      });
      
      // Refresh the list of mentorships
      const myMentorships = await fetchMyMentorships();
      setMyMentorships(myMentorships);
      
    } catch (error) {
      console.error('Error requesting mentorship:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send mentorship request. Please try again.',
        type: 'destructive'
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelMentorshipRequest(requestId);
      setMentorshipRequests(prev => prev.filter(r => r.id !== requestId));
      toast({
        title: 'Request Cancelled',
        description: 'Your request has been cancelled.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel request'
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mentors</h1>
        <p className="text-muted-foreground">Connect with experienced mentors</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="find">Find Mentors</TabsTrigger>
          <TabsTrigger value="requests">My Requests ({mentorshipRequests.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="find" className="pt-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search mentors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMentors.map(mentor => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  onRequest={handleRequestMentorship}
                  onMessage={(m) => router.push(`/dashboard/messages?mentorId=${m.id}`)}
                />
              ))}
              {filteredMentors.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No mentors found</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="requests" className="pt-6">
          <div className="space-y-4">
            {mentorshipRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No mentorship requests</p>
              </div>
            ) : (
              mentorshipRequests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onCancel={handleCancelRequest}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
