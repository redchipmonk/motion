
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MOCK_USERS, getUserById, getMutualFollowers, getUserEvents } from '../data/mockData';
import EventCard from '../components/EventCard';
import { cn } from '../theme';
import { HiUserPlus, HiUser } from 'react-icons/hi2';
import { FaInstagram, FaFacebook } from 'react-icons/fa';
import type { User, EventFeedItem } from '../types';

// --- Components ---

// Exact copy from EventDetailPage
const AttendeeAvatar = ({ name, status }: { name: string; status: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="h-40 w-40 rounded-full bg-white flex items-center justify-center text-9xl text-[#d8b4fe] border-2 border-transparent shadow-lg text-motion-purple">
      <HiUser />
    </div>
    <span className="text-base font-bold text-motion-purple">{name}</span>
    <span className="text-xs font-medium text-motion-purple/80 tracking-wide">
      {status === 'following' ? 'Following' : status}
    </span>
  </div>
);

const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex items-center gap-4 mb-6">
    <h3 className="text-3xl font-bold text-motion-plum">{title}</h3>
    {action}
  </div>
);

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  // Determine which profile to show
  const targetUserId = userId || authUser?._id;

  // State
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<User[]>([]);
  const [events, setEvents] = useState<EventFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived state
  const isOwnProfile = authUser?._id === targetUserId;

  useEffect(() => {
    if (!targetUserId) return;

    // Simulate fetch
    setLoading(true);

    // 1. Get User
    const foundUser = getUserById(targetUserId);
    setTargetUser(foundUser || null);

    // 2. Get Connections / Mutuals
    if (isOwnProfile) {
      // "My Connections" -> In mock, just show some random users as "Connections"
      setConnections(MOCK_USERS.filter(u => u._id !== targetUserId).slice(0, 8));
    } else if (authUser) {
      // "Mutual Followers"
      setConnections(getMutualFollowers(authUser._id, targetUserId));
    }

    // 3. Get Events
    const userEvents = getUserEvents(targetUserId);
    setEvents(userEvents);

    setLoading(false);
  }, [targetUserId, authUser, isOwnProfile]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-motion-lavender">
      <div className="text-xl font-bold text-motion-plum animate-pulse">Loading Profile...</div>
    </div>
  }

  if (!targetUser) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-motion-lavender gap-4">
        <h1 className="text-3xl font-bold text-motion-plum">User Not Found</h1>
        <button onClick={() => navigate('/')} className="text-motion-purple hover:underline">Go Home</button>
      </div>
    );
  }

  // Transform events to EventSummary for Card
  const eventSummaries = events.map(event => ({
    id: event._id,
    title: event.title,
    host: event.creatorDetails?.name || 'Unknown',
    datetime: new Date(event.dateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    startsAt: event.dateTime,
    heroImageUrl: event.images?.[0] || '',
    tags: event.tags,
    location: event.location
  }));

  return (
    <div className="min-h-screen bg-motion-lavender pb-20">

      {/* Header Section - No white background */}
      <section className="px-12 pt-16 pb-12">
        <div className="max-w-8xl mx-auto flex flex-col md:flex-row items-start gap-12">

          {/* Left: Avatar + Social Links */}
          <div className="flex flex-col items-center gap-6 shrink-0">
            {/* Larger Avatar */}
            <div className="h-64 w-64 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-motion-lilac flex items-center justify-center">
              {targetUser.avatarUrl ? (
                <img src={targetUser.avatarUrl} alt={targetUser.name} className="h-full w-full object-cover" />
              ) : (
                <HiUser className="text-9xl text-white/50" />
              )}
            </div>

            {/* Social Links - Stacked */}
            <div className="flex flex-col items-center gap-3 text-motion-purple text-lg font-bold">
              <a href="#" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <FaInstagram className="text-xl" /> Instagram
              </a>
              <a href="#" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <FaFacebook className="text-xl" /> Facebook
              </a>
            </div>
          </div>

          {/* Right: User Info */}
          <div className="flex-1 text-left space-y-6">
            <h1 className="text-5xl font-bold text-black">{targetUser.name}</h1>
            <p className="text-xl text-black/80 leading-relaxed max-w-3xl">
              {targetUser.bio || "No bio available."}
            </p>

            {/* Action Button */}
            <div className="pt-4">
              {isOwnProfile ? (
                <button
                  onClick={() => console.log('Edit Profile')}
                  className="bg-motion-yellow text-motion-purple font-bold text-xl py-3 px-12 rounded-full border-2 border-transparent hover:border-motion-purple active:scale-95 transition-all shadow-md"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => console.log('Connect')}
                  className="bg-motion-yellow text-motion-purple font-bold text-xl py-3 px-12 rounded-full border-2 border-transparent hover:border-motion-purple active:scale-95 transition-all shadow-md"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area - Consistent margins */}
      <div className="max-w-8xl mx-auto px-12 space-y-16">

        {/* Connections Section - Exact copy from EventDetailPage Attendees */}
        <section>
          <SectionHeader
            title={isOwnProfile ? `${connections.length} Connections` : `${connections.length} Mutual Followers`}
            action={
              <button
                className="text-motion-purple italic hover:underline"
              >
                view all {isOwnProfile ? 'connections' : 'followers'} →
              </button>
            }
          />

          <div className={cn("flex w-full overflow-x-auto pb-4 gap-6", connections.length >= 7 ? "justify-between" : "")}>
            {connections.slice(0, 7).map((conn, i) => (
              <AttendeeAvatar key={i} name={conn.name} status="Following" />
            ))}
          </div>
        </section>

        {/* Events Section */}
        <section>
          <h2 className="text-3xl font-bold text-black mb-8">
            {isOwnProfile ? "Highlighted Events" : "Highlighted Events"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {eventSummaries.map(event => (
              <EventCard
                key={event.id}
                event={event}
                variant="list"
                showHost={false}
                onSelect={(id) => navigate(`/events/${id}`)}
              />
            ))}

            {/* Add New Event Card */}
            {isOwnProfile && (
              <div
                onClick={() => navigate('/add-event')}
                className="aspect-square bg-white rounded-[28px] border-2 border-dashed border-motion-purple/30 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/50 transition-colors group"
              >
                <div className="h-20 w-20 rounded-full bg-motion-lilac flex items-center justify-center group-hover:scale-110 transition-transform">
                  <HiUserPlus className="text-4xl text-motion-purple" />
                  <span className="text-5xl text-motion-purple font-light absolute">+</span>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default ProfilePage;
