"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface MentorshipRequest {
  id: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface MentorshipRequestsResponse {
  requests: MentorshipRequest[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
}

export default function MentorshipRequestsSection() {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/mentor/mentorship-requests?status=PENDING&limit=5');
      
      if (!response.ok) {
        throw new Error('Failed to fetch mentorship requests');
      }
      
      const data: MentorshipRequestsResponse = await response.json();
      setRequests(data.requests);
      setError(null);
    } catch (error) {
      console.error('Error fetching mentorship requests:', error);
      setError('Failed to load mentorship requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'ACCEPTED' | 'REJECTED', rejectionReason?: string) => {
    try {
      setProcessingRequest(requestId);
      
      const response = await fetch(`/api/mentor/mentorship-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action,
          rejectionReason: rejectionReason
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action.toLowerCase()} request`);
      }

      // Remove the processed request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Show success message (you might want to use a toast library here)
      console.log(`Request ${action.toLowerCase()} successfully`);
      
    } catch (error) {
      console.error(`Error ${action.toLowerCase()} request:`, error);
      // Show error message (you might want to use a toast library here)
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-white rounded-xl shadow-sm p-6 overflow-hidden"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    );
  }

  if (error) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-white rounded-xl shadow-sm p-6 overflow-hidden"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchRequests}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-white rounded-xl shadow-sm p-6 overflow-hidden"
    >
      <div className="flex justify-between items-center mb-4 min-w-0">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center break-words min-w-0">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
          Mentorship Requests
          {requests.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {requests.length}
            </span>
          )}
        </h2>
        <a
          href="/dashboard/mentor/mentorship-requests"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium break-words"
        >
          View All
        </a>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No pending mentorship requests</p>
          <p className="text-sm text-gray-400 mt-1">
            New requests will appear here when students apply for mentorship
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between min-w-0 mb-3">
                <div className="flex items-center min-w-0">
                  <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex-shrink-0">
                    {request.student.image ? (
                      <Image
                        src={request.student.image}
                        alt={request.student.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <Users className="h-5 w-5 m-2.5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 break-words">
                      {request.student.name}
                    </h3>
                    <p className="text-sm text-gray-500 break-words">
                      {request.student.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(request.createdAt)}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 break-words overflow-wrap-anywhere max-w-full">
                  {request.message}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleRequestAction(request.id, 'REJECTED')}
                  disabled={processingRequest === request.id}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  {processingRequest === request.id ? 'Processing...' : 'Decline'}
                </button>
                <button
                  onClick={() => handleRequestAction(request.id, 'ACCEPTED')}
                  disabled={processingRequest === request.id}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {processingRequest === request.id ? 'Processing...' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
