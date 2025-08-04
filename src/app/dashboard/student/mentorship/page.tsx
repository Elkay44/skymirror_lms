'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { format } from 'date-fns'
import { addDays } from 'date-fns'
import { Loader2, MessageSquare, Clock, X, Star, Search, CalendarIcon } from "lucide-react"
import { toast } from 'sonner'
import { fetchMentors, requestMentorship, cancelMentorshipRequest, RequestMentorshipParams, fetchMyMentorships } from '@/services/mentorship'

import { MentorshipRequest } from '@/types/mentorship'
import { Mentor } from '@/types/mentorship'

export type TabValue = 'find' | 'my' | 'requests'

export default function MentorshipPage() {
  const { data: session } = useSession()
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [myMentors, setMyMentors] = useState<MentorshipRequest[]>([])
  const [requests, setRequests] = useState<MentorshipRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabValue>('find')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [sessionDate, setSessionDate] = useState<Date>(addDays(new Date(), 1))
  const [duration, setDuration] = useState<number>(60)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      const [mentorsData, mentorshipData] = await Promise.all([
        fetchMentors(),
        fetchMyMentorships()
      ])
      
      setMentors(mentorsData.map(mentor => ({
        ...mentor,
        image: mentor.image || null
      })))
      
      // Split mentorship data into myMentors and requests based on status
      const myMentors = mentorshipData.filter((session: any) => 
        session.status === 'ACCEPTED' || session.status === 'REJECTED'
      )
      const requests = mentorshipData.filter((session: any) => 
        session.status === 'PENDING'
      )
      
      setMyMentors(myMentors)
      setRequests(requests)
    } catch (error) {
      toast.error('Failed to load mentorship data')
    } finally {
      setIsLoading(false)
    }
  };

  const handleRequestMentorship = async () => {
    if (!selectedMentor || !session?.user?.id) {
      toast.error('Please select a mentor and log in to send a request.');
      return;
    }

    try {
      setIsRequesting(true);
      
      // Prepare mentorship request parameters
      const requestParams: RequestMentorshipParams = {
        mentorId: selectedMentor.id,  // This will be resolved to profile ID on server
        menteeId: session.user.id,    // This will be resolved to profile ID on server
        title: `Mentorship Request - ${selectedMentor.name}`,
        description: requestMessage,
        scheduledAt: new Date(sessionDate.getTime()).toISOString(),
        duration: duration,
        meetingUrl: undefined,
        notes: undefined
      };

      // Send the request
      await requestMentorship(requestParams);
      
      // Update local state and show success message
      await loadData();
      toast.success(`Mentorship request sent to ${selectedMentor.name}. Waiting for mentor's response.`);
      setSelectedMentor(null);
      setRequestMessage('');
      setSessionDate(addDays(new Date(), 1));
      setDuration(60);
    } catch (error: any) {
      console.error('Error in mentorship request:', error);
      
      // Handle specific error cases
      if (error.message === 'Mentor not found') {
        toast.error('Mentor profile not found. Please try again.');
      } else if (error.message === 'Failed to create student profile') {
        toast.error('Failed to create your profile. Please try again.');
      } else if (error.message === 'Failed to create mentorship request') {
        toast.error('Failed to create mentorship request. Please try again.');
      } else {
        toast.error('An error occurred. Please try again.');
      }
      
      setIsRequesting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      setIsRequesting(true);
      await cancelMentorshipRequest(requestId);
      await loadData();
      toast.success('Request cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel request');
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning'
      case 'ACCEPTED':
        return 'success'
      case 'REJECTED':
        return 'destructive'
      case 'CANCELLED':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const filteredMentors = mentors.filter((mentor: Mentor) =>
    mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.specialties?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mentor.specialties && 
     Array.isArray(JSON.parse(mentor.specialties)) &&
     JSON.parse(mentor.specialties).some((specialty: string) => 
       specialty.toLowerCase().includes(searchTerm.toLowerCase())
     ))
  )



  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between min-w-0">
        <h1 className="text-2xl font-semibold break-words">Mentorship</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8 min-w-0">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
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
                  <Card key={mentor.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center space-x-4 min-w-0">
                          <Avatar>
                            <AvatarImage src={mentor.image || undefined} alt={mentor.name} />
                            <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium break-words">{mentor.name}</h4>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium break-words">About</h4>
                          <p className="text-muted-foreground">{mentor.bio || 'No bio available'}</p>
                        </div>
                        {mentor.specialties && (
                          <div>
                            <h4 className="font-medium break-words">Specialties</h4>
                            <div className="flex flex-wrap gap-2 min-w-0">
                              {JSON.parse(mentor.specialties).map((specialty: string) => (
                                <Badge key={specialty} variant="secondary">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium break-words">Rating</h4>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                              {Array.from({ length: Math.floor(mentor.rating) }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400" />
                              ))}
                              {mentor.rating % 1 !== 0 && (
                                <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />
                              )}
                            </div>
                            <span className="text-muted-foreground">
                              ({mentor.reviewCount} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedMentor(mentor)}
                      >
                        Send Request
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {filteredMentors.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium break-words">No mentors found</h3>
                  <p className="text-muted-foreground mt-1">
                    {searchTerm ? 'Try a different search term' : 'No mentors available at the moment'}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="my" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(myMentors || []).map((mentor) => (
                  <Card key={mentor.id}>
                    <CardHeader>
                      <div className="flex items-center space-x-4 min-w-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={mentor.mentor.image} alt={mentor.mentor.name} />
                          <AvatarFallback>{mentor.mentor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg break-words">{mentor.mentor.name}</CardTitle>
                          <CardDescription>Expert Mentor</CardDescription>
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
                        <div className="flex items-center justify-between min-w-0">
                          <div className="flex items-center space-x-4 min-w-0">
                            <Avatar>
                              <AvatarImage src={request.mentor.image} alt={request.mentor.name} />
                              <AvatarFallback>{request.mentor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium break-words">{request.mentor.name}</h4>
                              <p className="text-sm text-muted-foreground break-words">
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
                        <div className="flex w-full items-center justify-between min-w-0">
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
                  <h3 className="text-lg font-medium break-words">No requests yet</h3>
                  <p className="text-muted-foreground mt-1">
                    Your mentorship requests will appear here
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
      {/* Request Mentorship Dialog */}
      {selectedMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 min-w-0">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6 min-w-0">
              <h3 className="text-lg font-medium break-words">Request Mentorship</h3>
              <X className="h-4 w-4 cursor-pointer" onClick={() => setSelectedMentor(null)} />
            </div>
            <div className="space-y-4">
              <div>
                <Label>Mentor</Label>
                <div className="flex items-center space-x-3 min-w-0">
                  <Avatar className="h-6 w-6 lg:h-8 lg:w-8">
                    <AvatarImage src={selectedMentor?.image || undefined} alt={selectedMentor?.name || 'Mentor'} />
                    <AvatarFallback>{selectedMentor?.name?.charAt(0) || 'M'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium break-words">{selectedMentor?.name || 'Mentor'}</p>
                  </div>
                </div>
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  placeholder="Why would you like to work with this mentor?"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>
              <div className="flex justify-end min-w-0">
                <Button variant="outline" onClick={() => setSelectedMentor(null)}>
                  Cancel
                </Button>
                <Button 
                  className="ml-2"
                  onClick={handleRequestMentorship}
                  disabled={isRequesting}
                >
                  {isRequesting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
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
