'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function MyMentors() {
  const { data: session } = useSession();
  const [mentors, setMentors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyMentors = async () => {
      if (!session?.user?.id) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/mentors/my`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch your mentors');
        }
        
        const data = await response.json();
        setMentors(data);
      } catch (err) {
        console.error('Error fetching mentors:', err);
        setError('Failed to load your mentors. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyMentors();
  }, [session]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mentors.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            You don't have any mentors yet. Browse the "Find Mentors" tab to connect with mentors.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {mentors.map((mentorship) => (
        <Card key={mentorship.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={mentorship.mentor?.user?.image} />
                <AvatarFallback>
                  {mentorship.mentor?.user?.name?.charAt(0) || 'M'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {mentorship.mentor?.user?.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {mentorship.mentor?.specialties?.split(',').slice(0, 2).join(' • ')}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Message</Button>
              <Button variant="outline" size="sm">Schedule</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Focus Area</p>
                <p className="text-muted-foreground">
                  {mentorship.focusArea || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="font-medium">Status</p>
                <Badge variant={mentorship.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {mentorship.status || 'PENDING'}
                </Badge>
              </div>
              <div>
                <p className="font-medium">Start Date</p>
                <p className="text-muted-foreground">
                  {mentorship.startDate 
                    ? new Date(mentorship.startDate).toLocaleDateString() 
                    : 'Not started'}
                </p>
              </div>
              <div>
                <p className="font-medium">Next Session</p>
                <p className="text-muted-foreground">
                  {mentorship.nextSessionDate 
                    ? new Date(mentorship.nextSessionDate).toLocaleString() 
                    : 'Not scheduled'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
