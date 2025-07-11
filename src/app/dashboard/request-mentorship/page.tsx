'use client';
import { useEffect, useState } from 'react';

interface Mentor {
  id: string;
  userId: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  specialties?: string[];
}

interface MentorshipRequest {
  id: string;
  mentorId: string;
  mentor: string;
  status: string;
}

export default function RequestMentorshipPage() {
  const [selectedMentorProfile, setSelectedMentorProfile] = useState<Mentor | null>(null);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [myMentors, setMyMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch mentorship requests and mentors
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch all mentorships for the student
        const res = await fetch('/api/mentorships?role=student');
        if (!res.ok) throw new Error('Failed to fetch mentorship requests');
        const mentorships = await res.json();
        setRequests((mentorships || []).map((m: any) => ({
          id: m.id,
          mentorId: m.mentor?.user?.id || m.mentor?.userId || '',
          mentor: m.mentor?.user?.name || 'Mentor',
          status: m.status,
        })));
        // Extract mentors from active mentorships
        setMyMentors((mentorships || [])
          .filter((m: any) => m.status === 'ACTIVE' && m.mentor?.user)
          .map((m: any) => ({
            id: m.mentor?.id || '',
            userId: m.mentor?.user?.id,
            name: m.mentor?.user?.name,
            email: m.mentor?.user?.email,
            image: m.mentor?.user?.image,
            bio: m.mentor?.user?.bio,
            specialties: m.mentor?.specialties,
          }))
        );
        // Fetch only available mentors for selection
        const mentorsRes = await fetch('/api/mentors?available=true');
        if (mentorsRes.ok) {
          const mentorsData = await mentorsRes.json();
          setMentors(mentorsData);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Handle mentorship request submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      if (!selectedMentorId) throw new Error('Please select a mentor');
      const res = await fetch('/api/mentorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId: selectedMentorId, notes }),
      });
      if (!res.ok) {
        const errRes = await res.json();
        throw new Error(errRes.error || 'Failed to submit mentorship request');
      }
      setSuccess('Mentorship request submitted!');
      setNotes('');
      setSelectedMentorId('');
      // Refresh mentorships and mentors
      const updated = await fetch('/api/mentorships?role=student');
      if (updated.ok) {
        const mentorships = await updated.json();
        setRequests((mentorships || []).map((m: any) => ({
          id: m.id,
          mentorId: m.mentor?.user?.id || m.mentor?.userId || '',
          mentor: m.mentor?.user?.name || 'Mentor',
          status: m.status,
        })));
        setMyMentors((mentorships || [])
          .filter((m: any) => m.status === 'ACTIVE' && m.mentor?.user)
          .map((m: any) => ({
            id: m.mentor?.id || '',
            userId: m.mentor?.user?.id,
            name: m.mentor?.user?.name,
            email: m.mentor?.user?.email,
            image: m.mentor?.user?.image,
            bio: m.mentor?.user?.bio,
            specialties: m.mentor?.specialties,
          }))
        );
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Mentorship</h1>

      {/* Section: My Mentors */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Your Mentors</h2>
        {loading ? (
          <div>Loading mentors...</div>
        ) : myMentors.length === 0 ? (
          <div>You don't have any active mentors yet.</div>
        ) : (
          <ul className="space-y-2">
            {myMentors.map((mentor) => (
              <li key={mentor.userId} className="bg-gray-50 p-4 rounded shadow flex items-center">
                {mentor.image && <img src={mentor.image} alt={mentor.name} className="w-10 h-10 rounded-full mr-4" />}
                <div className="flex-1">
                  <div className="font-semibold">{mentor.name}</div>
                  <div className="text-xs text-gray-500">{mentor.email}</div>
                  {mentor.specialties && mentor.specialties.length > 0 && (
                    <div className="text-xs text-gray-400">Specialties: {mentor.specialties.join(', ')}</div>
                  )}
                  {mentor.bio && (
                    <div className="text-xs text-gray-400 mt-1">{mentor.bio}</div>
                  )}
                </div>
                <button
                  className="ml-4 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => setSelectedMentorProfile(mentor)}
                  type="button"
                >
                  View Profile
                </button>
              </li>
            ))}

            {/* Mentor Profile Modal */}
            {selectedMentorProfile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSelectedMentorProfile(null)}
                  >
                    &times;
                  </button>
                  {selectedMentorProfile.image && (
                    <img src={selectedMentorProfile.image} alt={selectedMentorProfile.name} className="w-16 h-16 rounded-full mx-auto mb-3" />
                  )}
                  <div className="text-center">
                    <div className="font-bold text-lg mb-1">{selectedMentorProfile.name}</div>
                    <div className="text-xs text-gray-500 mb-1">{selectedMentorProfile.email}</div>
                    {selectedMentorProfile.specialties && selectedMentorProfile.specialties.length > 0 && (
                      <div className="text-xs text-gray-400 mb-1">Specialties: {selectedMentorProfile.specialties.join(', ')}</div>
                    )}
                    {selectedMentorProfile.bio && (
                      <div className="text-xs text-gray-400 mb-1">{selectedMentorProfile.bio}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ul>
        )}
      </div>

      {/* Section: Request Mentorship */}
      <form className="bg-white rounded shadow p-4 mb-8 max-w-lg" onSubmit={handleSubmit}>
        <h2 className="text-lg font-semibold mb-2">Request a Mentor</h2>
        <label className="block mb-2 font-semibold">Select a Mentor</label>
        <div className="mb-4">
          {mentors.length === 0 ? (
            <div className="text-gray-500">No available mentors right now.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {mentors.map((mentor) => (
                <li key={mentor.id} className="flex items-center py-2">
                  <input
                    type="radio"
                    id={`mentor-${mentor.userId}`}
                    name="mentor"
                    value={mentor.userId}
                    checked={selectedMentorId === mentor.userId}
                    onChange={() => setSelectedMentorId(mentor.userId)}
                    disabled={submitting}
                    className="mr-2"
                  />
                  <label htmlFor={`mentor-${mentor.userId}`} className="flex-1 cursor-pointer">
                    {mentor.name} {mentor.specialties && mentor.specialties.length > 0 && (
                      <span className="text-xs text-gray-400 ml-1">({mentor.specialties.join(', ')})</span>
                    )}
                  </label>
                  <button
                    type="button"
                    className="ml-2 text-blue-500 hover:text-blue-700 text-sm px-2 py-1"
                    onClick={() => setSelectedMentorProfile(mentor)}
                  >
                    ℹ️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <label className="block mb-2 font-semibold">Why do you want a mentor?</label>
        <textarea
          className="border rounded w-full p-2 mb-4"
          rows={3}
          placeholder="Describe your goals..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          disabled={submitting}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
        {success && <div className="mt-2 text-green-600">{success}</div>}
        {error && <div className="mt-2 text-red-600">{error}</div>}
      </form>

      {/* Section: Mentorship Requests */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Your Mentorship Requests</h2>
        {loading ? (
          <div>Loading requests...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : requests.length === 0 ? (
          <div>No mentorship requests found.</div>
        ) : (
          <ul className="space-y-2">
            {requests.map(req => (
              <li key={req.id} className="bg-gray-50 p-4 rounded shadow flex justify-between items-center">
                <span>Mentor: {req.mentor}</span>
                <span className="text-xs text-gray-500">{req.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

