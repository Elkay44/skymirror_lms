'use client';

import { useState } from 'react';
import { Menu, Search, Bell, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModeToggle } from '@/components/ModeToggle';

// Simple UserMenu component since the original is missing
const UserMenu = () => {
  return (
    <Button variant="ghost" size="icon">
      <User className="h-5 w-5" />
      <span className="sr-only">User menu</span>
    </Button>
  );
};

// Main navigation component
export const MainNav = () => {

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
          
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ModeToggle />
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="sr-only">View notifications</span>
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            </span>
          </Button>
          
          <Button variant="ghost" size="icon" className="relative">
            <Mail className="h-5 w-5" />
            <span className="sr-only">Messages</span>
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            </span>
          </Button>
          
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
