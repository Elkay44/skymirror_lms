import React from 'react';
import Image from 'next/image';
import { Star, Calendar, MessageSquare, Clock, Users } from 'lucide-react';

export interface MentorProfile {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  availability: string;
  description: string;
  isAvailableNow?: boolean;
}

interface MentorCardProps {
  mentor: MentorProfile;
  onRequestMentorship: (mentorId: string) => void;
  onContactMentor: (mentorId: string) => void;
  onViewProfile: (mentorId: string) => void;
}

export default function MentorCard({ mentor, onRequestMentorship, onContactMentor, onViewProfile }: MentorCardProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
      {/* Mentor header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center">
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {mentor.avatarUrl ? (
              <Image 
                src={mentor.avatarUrl} 
                alt={mentor.name} 
                fill 
                className="object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-xl font-semibold">
                {mentor.name.charAt(0)}
              </div>
            )}
            {mentor.isAvailableNow && (
              <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>
          
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{mentor.name}</h3>
            <p className="text-sm text-gray-500">{mentor.title}</p>
            <div className="flex items-center mt-1">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="ml-1 text-sm text-gray-600">{mentor.rating.toFixed(1)}</span>
              </div>
              <span className="mx-1.5 text-gray-500 text-sm">•</span>
              <span className="text-sm text-gray-500">{mentor.reviewCount} reviews</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mentor specialties */}
      <div className="px-5 py-3 border-b border-gray-100">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Specialties</h4>
        <div className="flex flex-wrap gap-1.5">
          {mentor.specialties.map((specialty, index) => (
            <span 
              key={index} 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>
      
      {/* Mentor availability */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="ml-1.5 text-sm text-gray-600">{mentor.availability}</span>
        </div>
      </div>
      
      {/* Mentor description */}
      <div className="px-5 py-3">
        <p className="text-sm text-gray-600 line-clamp-2">{mentor.description}</p>
      </div>
      
      {/* Action buttons */}
      <div className="px-5 py-4 bg-gray-50 flex space-x-3">
        <button
          onClick={() => onViewProfile(mentor.id)}
          className="flex-1 text-sm text-gray-700 font-medium hover:text-gray-900"
        >
          View Profile
        </button>
        <button
          onClick={() => onContactMentor(mentor.id)}
          className="flex-1 flex justify-center items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <MessageSquare className="mr-1.5 h-4 w-4" />
          Message
        </button>
        <button
          onClick={() => onRequestMentorship(mentor.id)}
          className="flex-1 flex justify-center items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Users className="mr-1.5 h-4 w-4" />
          Request
        </button>
      </div>
    </div>
  );
}
