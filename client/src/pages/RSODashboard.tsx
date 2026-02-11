import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import EventCard from '../components/EventCard';
import { HiPlus, HiPencil, HiXMark } from 'react-icons/hi2';
import type { User, EventFeedItem } from '../types';

const RSODashboard = () => {
  const { rsoId } = useParams();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [rso, setRso] = useState<User | null>(null);
  const [events, setEvents] = useState<EventFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', location: '', website: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!rsoId || !authUser) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch RSO Details
        const rsoData = await api.get<User>(`/users/${rsoId}`);
        setRso(rsoData);
        setEditForm({
          name: rsoData.name || '',
          bio: rsoData.bio || '',
          location: typeof rsoData.location === 'string' ? rsoData.location : '',
          website: rsoData.website || ''
        });

        // 2. Check if manager (Backend should enforce this on sensitive actions, but fro UI we check list)
        // We can fetch managed-rsos again to verify
        const managed = await api.get<User[]>('/users/managed-rsos');
        const managesThis = managed.some(m => m._id === rsoId);
        setIsManager(managesThis);

        if (!managesThis) {
          // Redirect or show error?
          // For now, let's just let them see the dashboard but disable actions? 
          // Better to redirect.
          // navigate('/profile');
        }

        // 3. Fetch Events
        const rsoEvents = await api.get<EventFeedItem[]>(`/events?createdBy=${rsoId}`);
        setEvents(rsoEvents);

      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [rsoId, authUser, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rso) return;
    setSaving(true);
    try {
      // API call to update user profile
      const updatedUser = await api.patch<User>(`/users/${rso._id}`, editForm);
      setRso(updatedUser);
      setIsEditProfileOpen(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-motion-lavender">
      <div className="text-xl font-bold text-motion-plum animate-pulse">Loading Dashboard...</div>
    </div>
  }

  if (!rso || !isManager) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-motion-lavender gap-4">
        <h1 className="text-3xl font-bold text-motion-plum">Access Denied</h1>
        <p>You do not have permission to manage this organization.</p>
        <button onClick={() => navigate('/profile')} className="text-motion-purple hover:underline">Back to Profile</button>
      </div>
    );
  }

  const eventSummaries = events.map(event => ({
    id: event._id,
    title: event.title,
    host: event.creatorDetails?.name || rso.name,
    datetime: new Date(event.dateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    startsAt: event.dateTime,
    heroImageUrl: event.images?.[0] || '',
    tags: event.tags,
    location: event.location,
    status: event.status
  }));

  return (
    <div className="min-h-screen bg-motion-lavender pb-20">
      <div className="max-w-8xl mx-auto px-12 pt-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-white">
              {rso.avatarUrl && <img src={rso.avatarUrl} className="w-full h-full object-cover" />}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-motion-plum">{rso.name} <span className="text-lg font-normal text-motion-purple opacity-70 ml-2">Manager Dashboard</span></h1>
              <p className="text-black/60">{rso.bio}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="bg-white text-motion-purple border-2 border-motion-purple px-6 py-2 rounded-full font-bold hover:bg-motion-lilac transition-colors flex items-center gap-2"
          >
            <HiPencil /> Edit Profile
          </button>
        </div>

        {/* Stats / Quick Actions */}
        <div className="grid grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-[25px] shadow-sm border border-motion-purple/10">
            <div className="text-sm uppercase font-bold text-motion-purple/60 mb-2">Total Followers</div>
            <div className="text-4xl font-bold text-motion-plum">{rso.followers?.length || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-[25px] shadow-sm border border-motion-purple/10">
            <div className="text-sm uppercase font-bold text-motion-purple/60 mb-2">Upcoming Events</div>
            <div className="text-4xl font-bold text-motion-plum">{events.filter(e => new Date(e.dateTime) > new Date()).length}</div>
          </div>
          <div className="bg-white p-6 rounded-[25px] shadow-sm border border-motion-purple/10 flex items-center justify-center cursor-pointer hover:bg-motion-warmWhite transition-colors"
            onClick={() => navigate('/add-event')}
          >
            <div className="flex flex-col items-center gap-2 text-motion-purple">
              <HiPlus className="text-4xl" />
              <span className="font-bold">Create New Event</span>
            </div>
          </div>
        </div>

        {/* Events List */}
        <h2 className="text-3xl font-bold text-motion-plum mb-8">Manage Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eventSummaries.length === 0 && <div className="text-black/50 italic col-span-full">No events created yet.</div>}
          {eventSummaries.map(event => (
            <div key={event.id} className="relative group">
              <EventCard
                event={event}
                variant="list"
                showHost={false}
                onSelect={(id) => navigate(`/events/${id}`)}
              />
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}/edit`); }}
                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md text-motion-purple hover:bg-motion-purple hover:text-white transition-colors z-10"
                title="Edit Event"
              >
                <HiPencil />
              </button>
            </div>
          ))}
        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setIsEditProfileOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
            >
              <HiXMark className="text-2xl" />
            </button>
            <h2 className="text-2xl font-bold text-motion-plum mb-6">Edit Organization Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-motion-purple focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Bio / Description</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 h-32 resize-none focus:ring-2 focus:ring-motion-purple focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-motion-purple focus:border-transparent outline-none"
                  placeholder="e.g. HUB 101"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-motion-purple focus:border-transparent outline-none"
                  placeholder="https://"
                />
              </div>
              <div className="pt-4 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-gray-500 font-bold hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-motion-purple text-white px-6 py-2 rounded-lg font-bold hover:bg-motion-plum transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RSODashboard;
