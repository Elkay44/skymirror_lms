'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function MentorList({ searchTerm }: { searchTerm: string }) {
  const [mentors, setMentors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setIsLoading(true);
        const url = `/api/mentors${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch mentors');
        }
        
        const data = await response.json();
        setMentors(data);
      } catch (err) {
        console.error('Error fetching mentors:', err);
        setError('Failed to load mentors. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-24" />
            </CardFooter>
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
          <p className="text-muted-foreground">No mentors found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {mentors.map((mentor) => (
        <Card key={mentor.id}>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={mentor.user?.image || ''} />
              <AvatarFallback>
                {mentor.user?.name?.charAt(0) || 'M'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{mentor.user?.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {mentor.specialties?.split(',').slice(0, 2).join(' • ')}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm line-clamp-3">
              {mentor.bio || 'No bio available.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {mentor.specialties?.split(',').slice(0, 3).map((specialty: string) => (
                <Badge key={specialty} variant="secondary">
                  {specialty.trim()}
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">View Profile</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
