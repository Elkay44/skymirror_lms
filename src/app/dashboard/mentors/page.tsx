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
import { fetchMentors, requestMentorship, fetchMyMentorships, cancelMentorshipRequest } from "@/services/mentorship";
import { Mentor, MentorshipRequest } from "@/types/mentorship";

interface MentorWithTitle extends Omit<Mentor, 'languages' | 'availability'> {
  title?: string;
  availability: {
    days: string[];
    timeRange: string;
  };
  experience: string;
  sessionRate: number;
  education: string;
  responseTime: string;
  languages: string[];
}

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

interface MentorCardProps {
  mentor: MentorWithTitle;
  onRequest: (mentor: MentorWithTitle) => void;
  onMessage: (mentor: MentorWithTitle) => void;
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
              <p className="text-sm text-muted-foreground">{mentor.title || 'Mentor'}</p>
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
          <span>{mentor.responseTime || 'Usually responds within 24 hours'}</span>
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
        <Button size="sm" onClick={() => onRequest(mentor)} disabled={!mentor.isAvailable}>
          <User className="mr-2 h-4 w-4" />
          {mentor.isAvailable ? 'Request Session' : 'Not Available'}
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
          {request.status === 'pending' && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(request.id)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {request.message || 'No message provided'}
        </p>
      </CardContent>
    </Card>
  );
};

export default function MentorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [mentors, setMentors] = useState<MentorWithTitle[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('find');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<MentorWithTitle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const mentorsData = await fetchMentors();
        setMentors(mentorsData);
        const requests = await fetchMyMentorships();
        setMentorshipRequests(requests);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load mentors and requests',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  const filteredMentors = mentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRequestMentorship = async (mentor: MentorWithTitle) => {
    try {
      await requestMentorship({
        mentorId: mentor.id,
        message: `Request to connect with ${mentor.name}`,
      });
      
      toast({
        title: 'Request Sent',
        description: `Your request to ${mentor.name} has been sent.`,
      });
      
      const requests = await fetchMyMentorships();
      setMentorshipRequests(requests);
      setActiveTab('requests');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send request',
        variant: 'destructive',
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
        description: 'Failed to cancel request',
        variant: 'destructive',
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
