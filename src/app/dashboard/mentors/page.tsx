'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { MentorList, MyMentors } from '@/components/mentors';

export default function MentorsPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('find');

  // Debug logging
  console.log('Mentors Page - Session:', session);
  console.log('Mentors Page - User Role:', session?.user?.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mentorship</h2>
          <p className="text-muted-foreground">
            {activeTab === 'find' 
              ? 'Find and connect with experienced mentors' 
              : 'Manage your mentorship relationships'}
          </p>
        </div>
        {activeTab === 'find' && (
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search mentors..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
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
          <MentorList searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <MyMentors />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mentorship Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You don't have any pending mentorship requests.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
