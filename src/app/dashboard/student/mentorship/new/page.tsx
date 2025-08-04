'use client';

import { useState, useEffect } from 'react';

import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User, MessageSquare, Calendar as CalendarIcon, Clock, Check, X, Star, ChevronDown, Filter } from 'lucide-react';

// Types
type Mentor = {
  id: string;
  name: string;
  role: string;
  image?: string;
  bio: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  sessionRate?: number;
};

type MentorshipRequest = {
  id: string;
  mentor: {
    id: string;
    name: string;
    image?: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  requestedDate: Date;
  message: string;
};

export default function StudentMentorshipPage() {

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('find');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Mock data
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [myMentors] = useState<Mentor[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Mock data
        const mockMentors: Mentor[] = [
          {
            id: '1',
            name: 'Dr. Sarah Johnson',
            role: 'Senior Software Engineer',
            bio: '10+ years of experience in full-stack development and mentoring junior developers.',
            specialties: ['React', 'Node.js', 'TypeScript'],
            rating: 4.8,
            reviewCount: 42,
            isAvailable: true,
            sessionRate: 85
          },
          {
            id: '2',
            name: 'Michael Chen',
            role: 'Lead Developer',
            bio: 'Specialized in cloud architecture and distributed systems.',
            specialties: ['AWS', 'Microservices', 'DevOps'],
            rating: 4.9,
            reviewCount: 36,
            isAvailable: true,
            sessionRate: 95
          },
          {
            id: '3',
            name: 'Emily Rodriguez',
            role: 'UX/UI Designer',
            bio: 'Passionate about creating intuitive user experiences and beautiful interfaces.',
            specialties: ['Figma', 'User Research', 'Prototyping'],
            rating: 4.7,
            reviewCount: 28,
            isAvailable: false,
            sessionRate: 75
          }
        ];
        
        setMentors(mockMentors);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleRequestMentorship = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setRequestMessage(`Hi ${mentor.name.split(' ')[0]}, I'd love to connect and learn from your experience.`);
    setIsRequestDialogOpen(true);
  };

  const submitMentorshipRequest = () => {
    if (!selectedMentor) return;
    
    const newRequest: MentorshipRequest = {
      id: `req-${Date.now()}`,
      mentor: {
        id: selectedMentor.id,
        name: selectedMentor.name,
        image: selectedMentor.image,
      },
      status: 'pending',
      requestedDate: new Date(),
      message: requestMessage
    };

    setRequests([...requests, newRequest]);
    setIsRequestDialogOpen(false);
    setActiveTab('requests');
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       mentor.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex justify-between items-center min-w-0">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-4 min-w-0">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col space-y-2 min-w-0">
        <h1 className="text-3xl font-bold tracking-tight break-words">Mentorship Program</h1>
        <p className="text-muted-foreground">
          Connect with experienced mentors to guide you through your learning journey.
        </p>
      </div>

      <Tabs 
        defaultValue="find" 
        className="space-y-4"
        onValueChange={(value) => setActiveTab(value as 'find' | 'my' | 'requests')}
      >
        <div className="flex justify-between items-center flex-wrap gap-4 min-w-0">
          <TabsList>
            <TabsTrigger value="find">Find Mentors</TabsTrigger>
            <TabsTrigger value="my">My Mentors</TabsTrigger>
            <TabsTrigger value="requests">My Requests</TabsTrigger>
          </TabsList>
          
          {activeTab === 'find' && (
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search mentors..."
                className="pl-9 w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="find" className="space-y-4">
          {filteredMentors.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMentors.map((mentor) => (
                <Card key={mentor.id} className="flex flex-col h-full min-w-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between min-w-0">
                      <div className="flex items-center space-x-4 min-w-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={mentor.image} alt={mentor.name} />
                          <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg break-words">{mentor.name}</CardTitle>
                          <CardDescription>{mentor.role}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center min-w-0">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="ml-1 text-sm font-medium break-words">
                          {mentor.rating.toFixed(1)}
                          <span className="text-muted-foreground"> ({mentor.reviewCount})</span>
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 break-words">{mentor.bio}</p>
                    
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5 min-w-0">
                        {mentor.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      
                      {mentor.sessionRate && (
                        <div className="flex items-center text-sm font-medium break-words min-w-0">
                          ${mentor.sessionRate} <span className="text-muted-foreground text-xs ml-1">/ hour</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-4 border-t">
                    <Button 
                      className="w-full"
                      onClick={() => handleRequestMentorship(mentor)}
                      disabled={!mentor.isAvailable}
                    >
                      {mentor.isAvailable ? 'Request Session' : 'Not Available'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted min-w-0">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium break-words">No mentors found</h3>
                <p className="mt-2 text-sm text-muted-foreground break-words">
                  {searchTerm 
                    ? `No mentors match your search for "${searchTerm}"`
                    : 'There are no mentors available at the moment.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          {myMentors.length > 0 ? (
            <div className="space-y-4">
              {myMentors.map((mentor) => (
                <Card key={mentor.id}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
                      <div className="flex items-center space-x-4 min-w-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={mentor.image} alt={mentor.name} />
                          <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle>{mentor.name}</CardTitle>
                          <CardDescription className="flex items-center min-w-0">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                            {mentor.rating.toFixed(1)} · {mentor.role}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 min-w-0">
                        <Button variant="outline" size="sm" className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Message
                        </Button>
                        <Button size="sm" className="gap-2">
                          <CalendarIcon className="h-4 w-4" />
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
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted min-w-0">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium break-words">No mentors yet</h3>
                <p className="mt-2 text-sm text-muted-foreground break-words">
                  You haven't connected with any mentors yet. Browse available mentors and send a request.
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveTab('find')}
                >
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                      <div className="flex items-center min-w-0">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={request.mentor.image} alt={request.mentor.name} />
                          <AvatarFallback>{request.mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium break-words">Mentorship Request</h3>
                          <p className="text-sm text-muted-foreground break-words">
                            Requested on {format(request.requestedDate, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div>
                        {request.status === 'pending' && (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                            <Clock className="h-3 w-3 mr-1.5" />
                            Pending
                          </Badge>
                        )}
                        {request.status === 'accepted' && (
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-900/30 dark:text-green-200">
                            <Check className="h-3 w-3 mr-1.5" />
                            Accepted
                          </Badge>
                        )}
                        {request.status === 'rejected' && (
                          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-900/30 dark:text-red-200">
                            <X className="h-3 w-3 mr-1.5" />
                            Declined
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground break-words">
                      {request.message}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t pt-4 min-w-0">
                    {request.status === 'accepted' && (
                      <>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button size="sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Schedule Session
                        </Button>
                      </>
                    )}
                    {request.status === 'pending' && (
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Follow-up
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted min-w-0">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium break-words">No pending requests</h3>
                <p className="mt-2 text-sm text-muted-foreground break-words">
                  You haven't sent any mentorship requests yet. Find a mentor to get started.
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveTab('find')}
                >
                  Find Mentors
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Mentorship Dialog */}
      {selectedMentor && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isRequestDialogOpen ? 'block' : 'hidden'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-start mb-4 min-w-0">
              <div>
                <h3 className="text-lg font-semibold break-words">Request Mentorship</h3>
                <p className="text-sm text-muted-foreground break-words">
                  Send a request to {selectedMentor.name}
                </p>
              </div>
              <button 
                onClick={() => setIsRequestDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1 break-words">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md text-sm break-words"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Write a message to introduce yourself and explain what you'd like to learn..."
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2 min-w-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsRequestDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitMentorshipRequest}
                  disabled={!requestMessage.trim()}
                >
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
