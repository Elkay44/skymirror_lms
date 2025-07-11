import React, { useState } from 'react';
import { CheckSquare, Clock, Calendar, AlertCircle, CheckCircle, Filter, Search } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  courseId: string;
  courseName: string;
  submitted: boolean;
  grade?: string | null;
  feedback?: string | null;
  submissionDate?: string | null;
}

interface AssignmentsSectionProps {
  assignments: Assignment[];
}

const AssignmentsSection: React.FC<AssignmentsSectionProps> = ({ assignments }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Calculate days until assignment is due
  const daysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Get badge styling based on assignment status
  const getStatusBadgeClass = (assignment: Assignment) => {
    if (assignment.submitted) {
      return 'bg-green-100 text-green-800';
    }
    if (daysUntilDue(assignment.dueDate) <= 2) {
      return 'bg-red-100 text-red-800';
    }
    if (daysUntilDue(assignment.dueDate) <= 7) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };
  
  // Get assignment status text
  const getStatusText = (assignment: Assignment) => {
    if (assignment.submitted) {
      return 'Submitted';
    }
    const days = daysUntilDue(assignment.dueDate);
    if (days <= 0) {
      return 'Overdue';
    }
    return `Due in ${days} day${days !== 1 ? 's' : ''}`;
  };

  // Safely handle arrays that might be undefined
  const safeArray = <T extends any>(arr: T[] | undefined | null): T[] => {
    return arr || [];
  };
  
  // Filter and sort assignments
  const filteredAssignments = assignments
    .filter(assignment => {
      // Filter by search term
      const matchesSearch = 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by status
      let matchesStatus = true;
      if (statusFilter === 'submitted') {
        matchesStatus = assignment.submitted;
      } else if (statusFilter === 'pending') {
        matchesStatus = !assignment.submitted;
      } else if (statusFilter === 'overdue') {
        matchesStatus = !assignment.submitted && daysUntilDue(assignment.dueDate) <= 0;
      } else if (statusFilter === 'upcoming') {
        matchesStatus = !assignment.submitted && daysUntilDue(assignment.dueDate) > 0;
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by submission status and due date
      if (a.submitted && !b.submitted) return 1;
      if (!a.submitted && b.submitted) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  
  if (!assignments || assignments.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Assignments Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          This mentee doesn't have any assignments to track at the moment. When they receive assignments, you'll be able to monitor them here.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full sm:w-auto"
          >
            <option value="all">All Assignments</option>
            <option value="submitted">Submitted</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAssignments.map((assignment) => (
          <div 
            key={assignment.id} 
            className={`bg-white border rounded-lg shadow-sm overflow-hidden transition-all duration-200 ${assignment.submitted ? 'border-green-200' : daysUntilDue(assignment.dueDate) <= 0 ? 'border-red-200' : 'border-gray-200'}`}
          >
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-md font-medium text-gray-900">{assignment.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{assignment.courseName}</p>
                </div>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(assignment)}`}>
                  {getStatusText(assignment)}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(assignment.dueDate)}
                  </p>
                </div>
                
                {assignment.submitted && assignment.submissionDate && (
                  <div>
                    <p className="text-xs text-gray-500">Submitted On</p>
                    <p className="text-sm font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(assignment.submissionDate)}
                    </p>
                  </div>
                )}
                
                {assignment.submitted && assignment.grade && (
                  <div>
                    <p className="text-xs text-gray-500">Grade</p>
                    <p className="text-sm font-medium">{assignment.grade}</p>
                  </div>
                )}
              </div>
              
              {assignment.feedback && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-1">Instructor Feedback</p>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {assignment.feedback}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={() => {
                    // Logic to view assignment details would go here
                    // For now, just show a toast message
                    console.log(`View assignment ${assignment.id}`);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredAssignments.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Matching Assignments</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            No assignments match your current filters. Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
      
      <div className="mt-6 flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700">Assignment Summary</h4>
          <p className="text-xs text-gray-500 mt-1">
            {assignments.filter(a => a.submitted).length} of {assignments.length} assignments submitted
            {assignments.filter(a => !a.submitted && daysUntilDue(a.dueDate) <= 0).length > 0 && (
              <span className="text-red-500 ml-2">
                ({assignments.filter(a => !a.submitted && daysUntilDue(a.dueDate) <= 0).length} overdue)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center">
          <div className="w-20 bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-teal-500 h-2.5 rounded-full" 
              style={{ width: `${Math.round((assignments.filter(a => a.submitted).length / assignments.length) * 100)}%` }}
            ></div>
          </div>
          <span className="ml-2 text-sm font-medium">
            {Math.round((assignments.filter(a => a.submitted).length / assignments.length) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsSection;
