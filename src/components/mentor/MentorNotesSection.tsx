import React, { useState, useEffect } from 'react';
import { FileText, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MentorNotesSectionProps {
  menteeId: string;
  initialNotes: string;
}

const MentorNotesSection: React.FC<MentorNotesSectionProps> = ({ menteeId, initialNotes }) => {
  const [notes, setNotes] = useState<string>(initialNotes || '');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const quickNotes = [
    'Shows strong analytical skills',
    'Needs help with time management',
    'Great progress in programming concepts',
    'Recommend additional practice in data structures',
    'Consider advanced topics in UI/UX design',
    'Struggling with algorithm complexity',
    'Excellent communication and collaboration',
    'Needs to focus on project planning'
  ];
  
  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);
  
  const handleSaveNotes = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/mentees/${menteeId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save notes');
      }
      
      toast.success('Notes saved successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const addQuickNote = (note: string) => {
    if (notes) {
      setNotes(prev => `${prev}\n• ${note}`);
    } else {
      setNotes(`• ${note}`);
    }
  };
  
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center min-w-0">
          <div className="flex items-center min-w-0">
            <FileText className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-md font-medium text-gray-900 break-words">Mentor Notes</h3>
          </div>
          
          {isEditing ? (
            <div className="flex space-x-2 min-w-0">
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
                disabled={isSaving}
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveNotes}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Notes
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
            >
              Edit Notes
            </button>
          )}
        </div>
        
        <div className="p-4">
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Add your notes about this mentee here..."
              />
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 break-words">Quick Notes</h4>
                <div className="flex flex-wrap gap-2 min-w-0">
                  {quickNotes.map((note, index) => (
                    <button
                      key={index}
                      onClick={() => addQuickNote(note)}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs text-gray-700 hover:bg-gray-200 min-w-0"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {note}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex min-w-0">
                  <div className="flex-shrink-0 min-w-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 break-words">
                      These notes are private and only visible to you. They will not be shared with the mentee or other instructors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {notes ? (
                <div className="prose prose-sm max-w-none">
                  {notes.split('\n').map((line, index) => (
                    <p key={index} className="mb-2 last:mb-0">{line}</p>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1 break-words">No Notes Yet</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    You haven't added any notes for this mentee yet.
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add First Note
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {!isEditing && notes && (
        <div className="flex justify-end min-w-0">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
                setNotes('');
                handleSaveNotes();
              }
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 break-words min-w-0"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Clear All Notes
          </button>
        </div>
      )}
    </div>
  );
};

export default MentorNotesSection;
