'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  User, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  X, 
  Star, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Loader2 
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Types
type Availability = {
  day: string;
  slots: string[];
};

type Review = {
  id: string;
  rating: number;
  comment: string;
  student: {
    name: string;
    avatar?: string;
  };
  date: Date;
};

type MentorshipRequest = {
  id: string;
  mentor: {
    id: string;
    name: string;
    image?: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  requestedDate: Date;
  messages: Array<{
    id: string;
    sender: 'mentor' | 'student';
    content: string;
    timestamp: Date;
  }>;
  scheduledSessions?: {
    id: string;
    date: Date;
    status: 'scheduled' | 'completed' | 'cancelled';
    meetingLink?: string;
  }[];
  lastMessage?: {
    content: string;
    timestamp: Date;
    isRead: boolean;
  };
};

type Mentor = {
  id: string;
  name: string;
  image?: string;
  role: string;
  bio: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  languages: string[];
  availability: {
    days: string[];
    timeRange: string;
  };
  experience: string;
  sessionRate: number;
  education: string;
  isAvailable: boolean;
  location?: string;
  timezone?: string;
  sessionTypes: Array<'video' | 'audio' | 'in-person'>;
  responseTime?: string;
};



export default function StudentMentorshipPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('find');
  
  // Mock data - replace with actual API calls
  const [mentors, setMentors] = useState<Mentor[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      role: 'Senior Software Engineer',
      bio: '10+ years of experience in full-stack development and mentoring junior developers.',
      specialties: ['React', 'Node.js', 'TypeScript', 'Mentoring'],
      rating: 4.8,
      reviewCount: 24,
      languages: ['English', 'Spanish'],
      availability: {
        days: ['Monday', 'Wednesday', 'Friday'],
        timeRange: '9:00 AM - 5:00 PM'
      },
      experience: '10+ years',
      sessionRate: 75,
      education: 'MSc in Computer Science',
      isAvailable: true,
      sessionTypes: ['video', 'audio']
    },
    // Add more mock mentors as needed
  ]);

  const [myMentors, setMyMentors] = useState<Mentor[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);

  const handleRequestMentorship = (mentorId: string) => {
    const mentor = mentors.find(m => m.id === mentorId);
    if (mentor) {
      const newRequest: MentorshipRequest = {
        id: `req-${Date.now()}`,
        mentor: {
          id: mentor.id,
          name: mentor.name,
          image: mentor.image
        },
        status: 'pending',
        requestedDate: new Date(),
        messages: [],
        scheduledSessions: []
      };
      setRequests([...requests, newRequest]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Mentorship Program</h1>
        <p className="text-muted-foreground">
          Connect with experienced mentors to guide you through your learning journey.
        </p>
      </div>

      <Tabs 
        defaultValue="find" 
        className="space-y-4"
        onValueChange={(value) => setActiveTab(value as 'find' | 'my' | 'requests')}
      >
        <TabsList>
          <TabsTrigger value="find">Find Mentors</TabsTrigger>
          <TabsTrigger value="my">My Mentors</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search mentors by name or specialty..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="flex flex-col h-full">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{mentor.name}</CardTitle>
                      <CardDescription>{mentor.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4">{mentor.bio}</p>
                  
                  <div className="mt-auto space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {mentor.specialties.map((specialty) => (
                        <span 
                          key={specialty}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full mt-4"
                      onClick={() => handleRequestMentorship(mentor.id)}
                    >
                      Request Mentorship
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          {myMentors.length > 0 ? (
            <div className="space-y-4">
              {myMentors.map((mentor) => (
                <Card key={mentor.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{mentor.name}</CardTitle>
                          <CardDescription>{mentor.role}</CardDescription>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button size="sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Session
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No mentors yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You haven't connected with any mentors yet. Browse available mentors and send a request.
                </p>
                <Button className="mt-4" onClick={() => setActiveTab('find')}>
                  Browse Mentors
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Mentorship Request</CardTitle>
                        <CardDescription>
                          Requested on {request.requestedDate.toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center">
                        {request.status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                        {request.status === 'accepted' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Accepted
                          </span>
                        )}
                        {request.status === 'rejected' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{request.mentor.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.status === 'pending' && 'Waiting for mentor to respond'}
                            {request.status === 'accepted' && 'Mentorship request accepted'}
                            {request.status === 'rejected' && 'Mentorship request declined'}
                          </p>
                        </div>
                      </div>
                      {request.status === 'accepted' && (
                        <Button variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No pending requests</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You haven't sent any mentorship requests yet. Find a mentor to get started.
                </p>
                <Button className="mt-4" onClick={() => setActiveTab('find')}>
                  Find Mentors
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
