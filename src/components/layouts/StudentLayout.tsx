"use client";

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Book, Award, FileText, Shield, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

interface StudentLayoutProps {
  children: ReactNode;
}

const StudentLayout = ({ children }: StudentLayoutProps) => {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard/student', icon: Home },
    { name: 'My Courses', href: '/dashboard/student/courses', icon: Book },
    { name: 'Certificates', href: '/dashboard/student/certificates', icon: Award },
    { name: 'Assignments', href: '/dashboard/student/assignments', icon: FileText },
    { name: 'Wallet', href: '/dashboard/student/wallet', icon: Shield },
    { name: 'Settings', href: '/dashboard/student/settings', icon: Settings },
  ];
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={toggleSidebar}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-blue-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={toggleSidebar}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-white">SkyMirror Academy</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-white hover:bg-blue-700"
                    >
                      <ItemIcon className="mr-4 h-6 w-6 text-blue-300" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-blue-700 p-4">
              <div className="flex items-center">
                <div>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {session?.user?.name?.[0] || 'S'}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-white">
                    {session?.user?.name || 'Student'}
                  </p>
                  <button
                    onClick={() => signOut()}
                    className="text-sm font-medium text-blue-300 hover:text-white flex items-center"
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-blue-800">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-white">SkyMirror Academy</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-blue-700"
                    >
                      <ItemIcon className="mr-3 h-5 w-5 text-blue-300" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-blue-700 p-4">
              <div className="flex items-center">
                <div>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {session?.user?.name?.[0] || 'S'}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {session?.user?.name || 'Student'}
                  </p>
                  <button
                    onClick={() => signOut()}
                    className="text-xs font-medium text-blue-300 hover:text-white flex items-center"
                  >
                    <LogOut className="mr-1 h-3 w-3" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 ml-2">SkyMirror Academy</h1>
        </div>
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
