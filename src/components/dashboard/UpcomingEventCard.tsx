"use client";

import React from 'react';
import { useState } from 'react';

interface UpcomingEventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    type: 'workshop' | 'webinar' | 'lecture' | 'other';
    isRegistered: boolean;
    description?: string;
    instructor?: string;
  };
}

export default function UpcomingEventCard({ event }: UpcomingEventCardProps) {
  const [isRegistered, setIsRegistered] = useState(event.isRegistered);
  
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric' 
  });
  
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const handleRegister = () => {
    // In a real implementation, this would make an API call to register for the event
    setIsRegistered(true);
  };

  // Define the color scheme based on event type
  const colorScheme = {
    workshop: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      icon: (
        <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    webinar: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: (
        <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    lecture: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: (
        <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    other: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: (
        <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const colors = colorScheme[event.type];

  return (
    <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 min-w-0 overflow-hidden">
      {/* Date column */}
      <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center p-4 bg-gray-50 border-r border-gray-200 min-w-0">
        <span className="text-xl font-bold text-gray-900 break-words">{eventDate.getDate()}</span>
        <span className="text-sm font-medium text-gray-600 break-words">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
        <span className="mt-1 text-xs text-gray-500">{formattedTime}</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start min-w-0">
          <div className={`flex-shrink-0 h-10 w-10 rounded-md flex items-center justify-center ${colors.bg} ${colors.text} mr-3`}>
            {colors.icon}
          </div>
          
          <div className="flex-1 min-w-0 min-w-0">
            <h3 className="text-base font-medium text-gray-900 break-words">{event.title}</h3>
            
            <div className="mt-1 flex items-center min-w-0">
              <span className="text-sm text-gray-500 break-words">
                {formattedDate} • {formattedTime}
              </span>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize break-words min-w-0">
                {event.type}
              </span>
            </div>
            
            {event.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2 break-words">{event.description}</p>
            )}
            
            {event.instructor && (
              <p className="mt-1 text-sm text-gray-500 break-words">Instructor: {event.instructor}</p>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex justify-end min-w-0">
          <button 
            onClick={handleRegister}
            disabled={isRegistered}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${isRegistered 
              ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
          >
            {isRegistered ? 'Registered' : 'Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
