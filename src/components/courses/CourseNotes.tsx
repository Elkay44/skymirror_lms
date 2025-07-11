"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  content: string;
  timestamp: number;
  lessonId: string;
  createdAt: string;
  updatedAt: string;
}

interface CourseNotesProps {
  lessonId: string;
  courseId: string;
  currentVideoTime?: number;
  className?: string;
}

export default function CourseNotes({
  lessonId,
  courseId,
  currentVideoTime = 0,
  className = '',
}: CourseNotesProps) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'current'>('all');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch notes when component mounts
  useEffect(() => {
    const fetchNotes = async () => {
      if (!session?.user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/notes`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch notes');
        }
        
        const data = await response.json();
        setNotes(data);
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast.error('Failed to load your notes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, [courseId, lessonId, session]);

  // Add a new note
  const addNote = async () => {
    if (!session?.user || !newNote.trim()) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNote.trim(),
          timestamp: currentVideoTime,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save note');
      }
      
      const savedNote = await response.json();
      setNotes(prev => [...prev, savedNote]);
      setNewNote('');
      toast.success('Note saved');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save your note');
    } finally {
      setSaving(false);
    }
  };

  // Delete a note
  const deleteNote = async (noteId: string) => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      
      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete your note');
    }
  };

  // Update a note
  const updateNote = async (noteId: string, content: string) => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      
      const updatedNote = await response.json();
      setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note));
      toast.success('Note updated');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update your note');
    }
  };

  // Capture timestamp from video
  const addTimestampToNote = () => {
    if (!textareaRef.current) return;
    
    const minutes = Math.floor(currentVideoTime / 60);
    const seconds = Math.floor(currentVideoTime % 60);
    const timestamp = `[${minutes}:${seconds < 10 ? '0' : ''}${seconds}]`;
    
    const cursorPosition = textareaRef.current.selectionStart;
    const textBefore = newNote.substring(0, cursorPosition);
    const textAfter = newNote.substring(cursorPosition);
    
    setNewNote(`${textBefore}${timestamp} ${textAfter}`);
    
    // Focus back on textarea and place cursor after timestamp
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPosition = cursorPosition + timestamp.length + 1;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Format timestamp for display
  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Filter notes based on current filter setting
  const filteredNotes = filter === 'all' 
    ? notes 
    : notes.filter(note => {
        // Consider notes within 30 seconds of current time as "current"
        const timeWindow = 30;
        return Math.abs(note.timestamp - currentVideoTime) <= timeWindow;
      });

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">My Notes</h3>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-2 py-1 text-xs rounded-md ${filter === 'all' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-700'}`}
          >
            All Notes
          </button>
          <button 
            onClick={() => setFilter('current')}
            className={`px-2 py-1 text-xs rounded-md ${filter === 'current' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-700'}`}
          >
            Current Section
          </button>
        </div>
      </div>
      
      {/* New note form */}
      <div className="mb-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Take notes about this lesson..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none min-h-[100px]"
            disabled={saving}
          />
          <button
            onClick={addTimestampToNote}
            className="absolute bottom-2 left-2 text-gray-500 hover:text-indigo-600 focus:outline-none"
            title="Add current timestamp"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        
        <div className="flex justify-end mt-2">
          <button
            onClick={addNote}
            disabled={!newNote.trim() || saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Note'}
          </button>
        </div>
      </div>
      
      {/* Notes list */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-4 text-gray-500 italic">
            {filter === 'all' ? 'No notes yet for this lesson.' : 'No notes for this section of the video.'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="bg-gray-50 rounded-lg p-3 relative group">
              <div className="flex items-start justify-between">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mb-2">
                  {formatTimestamp(note.timestamp)}
                </span>
                
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      const newContent = prompt('Edit your note:', note.content);
                      if (newContent && newContent !== note.content) {
                        updateNote(note.id, newContent);
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Edit note"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this note?')) {
                        deleteNote(note.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete note"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 whitespace-pre-wrap break-words text-sm">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
