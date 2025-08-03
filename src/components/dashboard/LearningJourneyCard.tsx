import React from 'react';
import Link from 'next/link';

interface LearningMilestone {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming';
  link?: string;
}

interface LearningJourneyCardProps {
  title?: string;
  milestones?: LearningMilestone[];
  currentIndex?: number;
  className?: string;
  description?: string;
  actionLink?: string;
  actionText?: string;
}

export default function LearningJourneyCard({
  title = 'Your Learning Journey',
  milestones = [],
  currentIndex = 0,
  className = '',
  description,
  actionLink,
  actionText
}: LearningJourneyCardProps) {
  // Support both milestone-based journey cards and simple info cards
  const hasMilestones = milestones.length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {description && (
        <p className="text-gray-600 mb-4">{description}</p>
      )}

      {hasMilestones ? (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute top-0 left-7 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Milestones */}
          <div className="space-y-8">
            {milestones.map(milestone => {
              let statusColor = '';
              let iconContent = <></>;
              
              switch (milestone.status) {
                case 'completed':
                  statusColor = 'bg-green-500 border-green-500';
                  iconContent = (
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  );
                  break;
                case 'current':
                  statusColor = 'bg-indigo-600 border-indigo-600';
                  iconContent = (
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  );
                  break;
                case 'upcoming':
                  statusColor = 'bg-white border-gray-300';
                  iconContent = (
                    <span className="h-4 w-4 block"></span>
                  );
                  break;
              }
              
              return (
                <div key={milestone.id} className="relative flex items-start">
                  {/* Milestone marker */}
                  <div className={`absolute top-0 left-0 h-7 w-7 rounded-full border-2 flex items-center justify-center ${statusColor} z-10`}>
                    {iconContent}
                  </div>
                  
                  {/* Milestone content */}
                  <div className="ml-14">
                    <h4 className={`text-base font-medium ${milestone.status === 'current' ? 'text-indigo-600' : 'text-gray-900'}`}>
                      {milestone.title}
                    </h4>
                    
                    {milestone.description && (
                      <p className="mt-1 text-sm text-gray-500">{milestone.description}</p>
                    )}
                    
                    {milestone.link && milestone.status !== 'upcoming' && (
                      <div className="mt-2">
                        <Link 
                          href={milestone.link}
                          className={`inline-flex items-center text-sm font-medium ${
                            milestone.status === 'current' ? 'text-indigo-600 hover:text-indigo-800' : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          {milestone.status === 'current' ? 'Continue' : 'Review'}
                          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      
      {/* Progress indicator - only show for milestone cards */}
      {hasMilestones && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{currentIndex + 1} of {milestones.length} steps completed</span>
            <span className="font-medium text-indigo-600">{Math.round(((currentIndex + 1) / milestones.length) * 100)}% complete</span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full">
            <div 
              className="h-2 bg-indigo-600 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${((currentIndex + 1) / milestones.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Action link */}
      {actionLink && actionText && (
        <div className="mt-4">
          <Link 
            href={actionLink}
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            {actionText}
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
