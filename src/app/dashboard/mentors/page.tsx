'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Search, MessageSquare, Clock, Check, X, User, Calendar, Plus, Loader2, Star } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { fetchMentors, requestMentorship, fetchMyMentorships, cancelMentorshipRequest } from "@/services/mentorship";
import { Mentor, MentorshipRequest } from "@/types/mentorship";

// Extend the Mentor type to include additional properties
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

// Helper function to get initials from name
const getInitials = (name: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(n => n[0] || '')
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Mentor Card Component
interface MentorCardProps {
  mentor: MentorWithTitle;
  onRequest: (mentor: MentorWithTitle) => void;
  onMessage: (mentor: MentorWithTitle) => void;
}

const MentorCard: React.FC<MentorCardProps> = ({ 
  mentor, 
  onRequest, 
  onMessage 
}) => (
  <Card className="h-full flex flex-col">
    <CardHeader>
      <div className="flex items-start space-x-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={mentor.image || ''} alt={mentor.name} />
          <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{mentor.name}</CardTitle>
          <CardDescription>{mentor.title || 'Mentor'}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex-1">
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {mentor.bio || 'No bio available'}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {mentor.specialties?.map((specialty: string, index: number) => (
          <Badge key={index} variant="secondary">
            {specialty}
          </Badge>
        )) || []}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center text-muted-foreground">
          <Star className="h-4 w-4 mr-2 text-yellow-500" />
          <span>{mentor.rating || 'N/A'} ({(mentor as any).reviewCount || 0} reviews)</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Clock className="h-4 w-4 mr-2" />
          <span>Response time: {mentor.responseTime || 'Within 24 hours'}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          <span>${mentor.sessionRate || 0}/session</span>
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onMessage(mentor)}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Message
      </Button>
      <Button 
        size="sm" 
        onClick={() => onRequest(mentor)}
      >
        <User className="h-4 w-4 mr-2" />
        Request Mentorship
      </Button>
    </CardFooter>
  </Card>
);

interface RequestCardProps {
  request: MentorshipRequest & {
    mentor?: {
      name: string;
      image?: string;
    };
    messages?: Array<{
      content: string;
      createdAt: string;
    }>;
  };
  onCancel: (id: string) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onCancel }) => {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    default: 'bg-gray-100 text-gray-800'
  };

  const getInitialMessage = () => {
    if (!request.messages || request.messages.length === 0) return 'No message provided';
    const latestMessage = request.messages[0];
    return latestMessage.content || 'No message content';
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{request.mentor?.name || 'Mentor'}</CardTitle>
            <CardDescription>
              Requested on {request.requestedDate ? format(new Date(request.requestedDate), 'MMM d, yyyy') : 'N/A'}
            </CardDescription>
          </div>
          <Badge className={statusColors[request.status] || statusColors.default}>
            {request.status ? 
              request.status.charAt(0).toUpperCase() + request.status.slice(1) : 
              'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {getInitialMessage()}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // TODO: Implement message view
          }}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          View Messages
        </Button>
        {request.status === 'pending' && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onCancel(request.id)}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Request
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const MentorsPage: React.FC = () => {
  const router = useRouter();
  const { showToast, Toast } = useToast() as unknown as { showToast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void; Toast: React.FC };
  
  // State management
  const [mentors, setMentors] = useState<MentorWithTitle[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('find');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorWithTitle | null>(null);
  const [requestMessage, setRequestMessage] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Helper function to transform mentor data
  const transformMentorData = (mentor: any): MentorWithTitle => ({
    ...mentor,
    // Ensure all required fields have proper fallbacks
    role: mentor.role || 'Mentor',
    title: mentor.role || 'Mentor', // Add title as an alias for role
    specialties: mentor.specialties || [],
    rating: mentor.rating || 0,
    reviewCount: mentor.reviewCount || 0,
    isAvailable: mentor.isAvailable !== undefined ? mentor.isAvailable : true,
    sessionTypes: mentor.sessionTypes || ['video', 'audio'],
    availability: mentor.availability || {
      days: ['Monday', 'Wednesday', 'Friday'],
      timeRange: '9:00 AM - 5:00 PM'
    },
    experience: mentor.experience || '5+ years',
    sessionRate: mentor.sessionRate || 50,
    education: mentor.education || 'MSc in Computer Science',
    responseTime: mentor.responseTime || 'Within 24 hours',
    languages: mentor.languages || ['English']
  });

  // Fetch data based on active tab
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch mentors if we're on the find tab
        if (activeTab === 'find') {
          const data = await fetchMentors();
          // Transform the data to match the Mentor type
          const transformedMentors = data.map(transformMentorData);
          setMentors(transformedMentors);
        }
        
        // Always fetch mentorship requests for my and requests tabs
        const requests = await fetchMyMentorships();
        setMentorshipRequests(requests);
      } catch (error) {
        console.error('Error loading data:', error);
        showToast({
          title: 'Error',
          description: 'Failed to load data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab, showToast]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle request button click
  const handleRequestClick = (mentor: MentorWithTitle) => {
    setSelectedMentor(mentor);
    setRequestMessage(''); // Reset message when opening dialog
    setIsDialogOpen(true);
  };
  
  // Handle send message to mentor
  const handleSendMessage = (mentor: MentorWithTitle) => {
    if (!mentor) return;
    
    // In a real app, this would open a chat with the mentor
    showToast({
      title: 'Message',
      description: `Opening chat with ${mentor.name}...`,
    });
    
    // Here you would typically navigate to a chat page or open a chat modal
    // router.push(`/messages?userId=${mentor.userId}`);
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search input clear
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  

  
  // Handle close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedMentor(null);
    setRequestMessage('');
  };

  // Handle mentorship request
  const handleRequestMentorship = async () => {
    if (!selectedMentor) return;
    
    try {
      setIsSubmitting(true);
      await requestMentorship(selectedMentor.id, requestMessage);
      
      showToast({
        title: 'Request Sent',
        description: `Your mentorship request has been sent to ${selectedMentor.name}`,
      });
      
      handleCloseDialog();
      
      // Refresh requests
      const requests = await fetchMyMentorships();
      setMentorshipRequests(requests);
      setActiveTab('requests');
    } catch (error) {
      console.error('Error requesting mentorship:', error);
      showToast({
        title: 'Error',
        description: 'Failed to send mentorship request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel request
  const handleCancelRequest = async (requestId: string) => {
    try {
      setIsSubmitting(true);
      await cancelMentorshipRequest(requestId);
      
      // Update local state
      setMentorshipRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'cancelled' as const } 
            : req
        )
      );
      
      showToast({
        title: 'Request Cancelled',
        description: 'Your mentorship request has been cancelled.',
      });
    } catch (error) {
      console.error('Error cancelling request:', error);
      showToast({
        title: 'Error',
        description: 'Failed to cancel request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  // Handle view mentor details
  const handleViewMentor = (mentor: MentorWithTitle) => {
    // In a real app, this would navigate to the mentor's profile
    showToast({
      title: 'Viewing Mentor',
      description: `Viewing ${mentor.name}'s profile...`,
    });
  };

  // Filter mentors based on search term
  const filteredMentors = mentors.filter(mentor => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      mentor.name.toLowerCase().includes(searchLower) ||
      mentor.specialties.some((s: string) => s.toLowerCase().includes(searchLower)) ||
      (mentor.bio && mentor.bio.toLowerCase().includes(searchLower)) ||
      mentor.languages.some((l: string) => l.toLowerCase().includes(searchLower))
    );
  });

  // Filter mentorship requests based on tab
  const pendingRequests = mentorshipRequests.filter(req => req.status === 'pending');
  const acceptedMentors = mentorshipRequests.filter(req => req.status === 'accepted');

  return (
    <div className="container mx-auto py-8">
      <Toast />
      <Tabs 
        defaultValue="find" 
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="find">Find Mentors</TabsTrigger>
            <TabsTrigger value="my">My Mentors</TabsTrigger>
            <TabsTrigger value="requests">
              My Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </TabsTrigger>
          </TabsList>
          
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search mentors..."
              className="pl-10"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        <TabsContent value="find" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMentors.length > 0 ? (
                filteredMentors.map((mentor) => (
                  <MentorCard 
                    key={mentor.id} 
                    mentor={mentor}
                    onRequest={handleRequestClick}
                    onMessage={handleSendMessage}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No mentors found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              {acceptedMentors.map((request) => (
                <MentorRequestCard 
                  key={request.id}
                  request={request}
                  onMessage={() => router.push(`/messages?mentorId=${request.mentor.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <MentorRequestCard 
                  key={request.id}
                  request={request}
                  onCancel={handleCancelRequest}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You don't have any pending mentorship requests.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setActiveTab('find')}>
                  <Search className="mr-2 h-4 w-4" />
                  Find Mentors
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Mentorship Dialog */}
      {isDialogOpen && selectedMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Request Mentorship</h2>
              <button 
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedMentor(null);
                  setRequestMessage('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedMentor.image || ''} alt={selectedMentor.name} />
                  <AvatarFallback>
                    {selectedMentor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedMentor.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedMentor.title}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message (optional)
                </label>
                <textarea
                  id="message"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Tell the mentor why you'd like to connect..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedMentor(null);
                    setRequestMessage('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRequestMentorship}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : 'Send Request'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// Mentor Request Card Component
function MentorRequestCard({ 
  request, 
  onMessage,
  onCancel 
}: { 
  request: MentorshipRequest;
  onMessage?: () => void;
  onCancel?: (id: string) => void;
}) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
  } as const;

  // Helper function to format date safely
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={request.mentor.image || ''} alt={request.mentor.name} />
              <AvatarFallback>
                {getInitials(request.mentor?.name || '')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{request.mentor?.name || 'Unknown Mentor'}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                <span>Requested {formatDate(request.requestedDate)}</span>
              </div>
            </div>
          </div>
          <Badge 
            className={`capitalize ${statusColors[request.status] || 'bg-gray-100 text-gray-800'}`}
          >
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-2">
          {request.lastMessage && (
            <div className="text-sm text-muted-foreground">
              Last message: {formatDate(request.lastMessage.timestamp)}
            </div>
          )}
          {request.scheduledSessions && request.scheduledSessions.length > 0 && (
            <div className="text-sm text-muted-foreground flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span>Next session: {formatDate(request.scheduledSessions[0].date)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pt-0">
        {onMessage && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onMessage}
            disabled={request.status !== 'accepted'}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
        )}
        {onCancel && (request.status === 'pending' || request.status === 'accepted') && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onCancel(request.id)}
          >
            <X className="h-4 w-4 mr-2" />
            {request.status === 'pending' ? 'Cancel Request' : 'End Mentorship'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
