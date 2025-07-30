'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User, MessageSquare, Clock, Check, X, Star, Loader2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { MentorshipRequest } from '@/types/mentorship';
import { Mentor, fetchMentors, requestMentorship, fetchMyMentorships, cancelMentorshipRequest } from '@/services/mentorship';
import { useToast } from '@/components/ui/use-toast';

type TabValue = 'find' | 'my' | 'requests';


export default function StudentMentorshipPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('find');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [myMentors, setMyMentors] = useState<Mentor[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  const { toast } = useToast();

  // Load data
  useEffect(() => {
    // Only load data if user is authenticated
    if (!session?.user?.id) {
      return;
    }

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Type guard to ensure session.user is defined
        if (!session?.user) {
          throw new Error('User session not available');
        }

        if (session.user.role !== 'STUDENT') {
          throw new Error('User must be a student to view mentorships');
        }
        
        // Fetch mentors first
        const mentorsData = await fetchMentors();
        if (!mentorsData || !Array.isArray(mentorsData)) {
          throw new Error('Failed to fetch mentors');
        }
        setMentors(mentorsData);
        
        // Then fetch mentor sessions
        const mentorshipsData = await fetchMyMentorships();
        if (!mentorshipsData || !Array.isArray(mentorshipsData)) {
          throw new Error('Failed to fetch mentorships');
        }
        
        // Filter accepted mentor sessions
        const acceptedSessions = mentorshipsData.filter((request: any) => request.status === 'ACCEPTED');
        const mentorIds = new Set(acceptedSessions.map((request: any) => request.mentor.id));
        const myMentorsData = mentorsData.filter((mentor: Mentor) => mentorIds.has(mentor.id));
        
        // Update state with filtered data
        setMyMentors(myMentorsData);
        setRequests(mentorshipsData);
      } catch (err: any) {
        console.error('Error in loadData:', err);
        const message = err.message || 'An unexpected error occurred';
        setError(message);
        toast({
          title: 'Error',
          description: message,
          type: 'destructive',
          action: {
            label: 'Retry',
            onClick: () => loadData()
          }
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [session]);

  const handleRequestMentorship = async () => {
    try {
      // Check if selectedMentor exists and has an id
      if (!selectedMentor || !selectedMentor.id) {
        throw new Error('No mentor selected or invalid mentor data');
      }
      
      setIsRequesting(true);
      
      // Ensure we have a valid mentor ID before making the request
      const mentorId = selectedMentor.id;
      if (!mentorId) {
        throw new Error('Invalid mentor ID');
      }
      
      // Get user ID from session
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const newRequest = await requestMentorship(
        mentorId,
        requestMessage || 'I would like to request mentorship with you.'
      );
      
      setRequests(prev => [...prev, newRequest]);
      setSelectedMentor(null);
      setRequestMessage('');
      
      toast({
        title: 'Request Sent',
        description: `Your mentorship request has been sent to ${selectedMentor.name || 'the mentor'}`,
        type: 'default',
      });
    } catch (err: any) {
      console.error('Error in handleRequestMentorship:', err);
      const message = err.message || 'Failed to send mentorship request';
      toast({
        title: 'Error',
        description: message,
        type: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    
    try {
      await cancelMentorshipRequest(requestId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast({
        title: 'Request Cancelled',
        description: 'Your mentorship request has been cancelled',
      });
    } catch (err: any) {
      const message = err.message;
      toast({
        title: 'Error',
        description: message,
        type: 'destructive',
      });
    }
  };

  // Filter mentors based on search term
  const filteredMentors = mentors.filter(mentor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      mentor.name.toLowerCase().includes(searchLower) ||
      (mentor.specialties && 
        Array.isArray(JSON.parse(mentor.specialties)) &&
        JSON.parse(mentor.specialties).some((s: string) => 
          s.toLowerCase().includes(searchLower)
        ))
    );
  });

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // The Toast component is now properly rendered by the ToastProvider in the root layout
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Mentorship Program</h1>
        <p className="text-muted-foreground">
          Connect with experienced mentors to guide you through your learning journey.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <Tabs 
        value={activeTab} 
        onValueChange={(value: string) => setActiveTab(value as TabValue)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="find">Find Mentors</TabsTrigger>
          <TabsTrigger value="my">My Mentors</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
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
                {filteredMentors.map((mentor) => (
                  <Card key={mentor.id} className="flex flex-col h-full">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={mentor.image} alt={mentor.name} />
                          <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{mentor.name}</CardTitle>
                          <CardDescription>{mentor.role}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {mentor.bio}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {mentor.specialties && 
                            Array.isArray(JSON.parse(mentor.specialties)) &&
                            JSON.parse(mentor.specialties).slice(0, 3).map((specialty: string) => (
                              <Badge key={specialty} variant="secondary">
                                {specialty}
                              </Badge>
                            ))}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium text-foreground">{mentor.rating}</span>
                          <span className="mx-1">•</span>
                          <span>{mentor.reviewCount} reviews</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-3">
                      <div className="flex w-full items-center justify-between">
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Messages
                        </Button>
                        {requests.some(req => req.mentor.id === mentor.id && req.status === 'PENDING') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCancelRequest(mentor.id)}
                            disabled={isRequesting}
                          >
                            {isRequesting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <X className="h-4 w-4 mr-2" />
                            )}
                            Cancel Request
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                    <CardFooter className="border-t px-6 py-3">
                      <Button 
                        className="w-full" 
                        onClick={() => setSelectedMentor(mentor)}
                      >
                        'Request Mentorship'
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {filteredMentors.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No mentors found</h3>
                  <p className="text-muted-foreground mt-1">
                    {searchTerm ? 'Try a different search term' : 'No mentors available at the moment'}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="my" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myMentors.map((mentor) => (
                  <Card key={mentor.id}>
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={mentor.image} alt={mentor.name} />
                          <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{mentor.name}</CardTitle>
                          <CardDescription>{mentor.role}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button className="w-full" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                        <Button className="w-full">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Schedule Session
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={request.mentor.image} alt={request.mentor.name} />
                              <AvatarFallback>{request.mentor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{request.mentor.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Requested {typeof request.requestedDate === 'string' 
                                  ? format(new Date(request.requestedDate), 'MMM d, yyyy')
                                  : format(request.requestedDate, 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusBadge(request.status)}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardFooter className="border-t px-6 py-3">
                        <div className="flex w-full items-center justify-between">
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Messages
                          </Button>
                          {request.status === 'PENDING' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleCancelRequest(request.id)}
                              disabled={isRequesting}
                            >
                              {isRequesting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <X className="h-4 w-4 mr-2" />
                              )}
                              Cancel Request
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No requests yet</h3>
                  <p className="text-muted-foreground mt-1">
                    Your mentorship requests will appear here
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="my" className="space-y-4">
              {myMentors.length > 0 ? (
                <div className="space-y-4">
                  {myMentors.map((mentor) => (
                    <Card key={mentor.id}>
                      <CardHeader>
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={mentor.image} alt={mentor.name} />
                            <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{mentor.name}</CardTitle>
                            <CardDescription>{mentor.role}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Button className="w-full" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Message
                          </Button>
                          <Button className="w-full">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Schedule Session
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No mentors yet</h3>
                  <p className="text-muted-foreground mt-1">
                    Your accepted mentorship requests will appear here
                  </p>
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Request Mentorship Dialog */}
      {selectedMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Request Mentorship</h3>
              <p className="text-sm text-muted-foreground">
                Send a message to {selectedMentor.name} to request mentorship.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell the mentor why you'd like to connect..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedMentor(null)}
                  disabled={isRequesting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRequestMentorship}
                  disabled={isRequesting || !requestMessage.trim()}
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Request'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
