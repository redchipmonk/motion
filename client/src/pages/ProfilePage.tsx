
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import EventCard from '../components/EventCard';
import { cn } from '../theme';
import { HiUser, HiCheck, HiXMark } from 'react-icons/hi2';
import { FaInstagram, FaFacebook } from 'react-icons/fa';
import type { User, EventFeedItem } from '../types';
import UserListOverlay from '../components/UserListOverlay';
import { getUserById, getEventsByHost, MOCK_USERS, MOCK_EVENTS, MOCK_RSVPS } from '../data/mockData';

// --- Components ---

const AttendeeAvatar = ({ name, status }: { name: string; status: string }) => (
  <div className="flex flex-col items-center gap-1 shrink-0">
    <div className="h-40 w-40 rounded-full bg-white flex items-center justify-center text-9xl text-[#d8b4fe] border-2 border-transparent shadow-lg text-motion-purple overflow-hidden">
      <HiUser />
    </div>
    <span className="text-base font-bold text-motion-purple text-center max-w-[160px] truncate">{name}</span>
    <span className="text-xs font-medium text-motion-purple/80 tracking-wide uppercase">
      {status}
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
  const [managedRSOs, setManagedRSOs] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Social State
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'self'>('none'); // 'none', 'pending', 'accepted', 'self'
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State

  const [isConnectionsListOpen, setIsConnectionsListOpen] = useState(false);
  const [isMutualsListOpen, setIsMutualsListOpen] = useState(false);
  const [isHighlightOverlayOpen, setIsHighlightOverlayOpen] = useState(false);



  const connectionListTitle = targetUser?.userType === 'organization' ? 'Followers' : 'Connections';

  // Filter out authUser from mutual connections display
  const mutualConnections = connections.filter(c => c._id !== authUser?._id);

  // Use connections for now as the display list
  const displayList = connections;
  const displayCount = connections.length;

  // Derived state
  const isOwnProfile = authUser?._id === targetUserId;

  useEffect(() => {
    if (!targetUserId) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        // 1. Fetch User Details
        const user = await api.get<User>(`/users/${targetUserId}`);
        setTargetUser(user);

        // 2. Fetch Social Connections
        // For Students: Show friends/connections
        // For RSOs: Show followers (managed differently, maybe just count or sample?)
        // The endpoint /:id/connections returns the 'connections' field.
        const userConnections = await api.get<User[]>(`/users/${targetUserId}/connections`);
        setConnections(userConnections);

        // 3. Fetch Events (Hosted)
        const userEvents = await api.get<EventFeedItem[]>(`/events?createdBy=${targetUserId}`);
        setEvents(userEvents);

        // 4. If viewing own profile, fetch managed RSOs
        if (isOwnProfile && authUser) {
          const rsos = await api.get<User[]>(`/users/managed-rsos`);
          setManagedRSOs(rsos);
        }

        // 5. Determine Relationship Status (if viewing someone else)
        if (authUser && !isOwnProfile) {
          if (user.userType === 'organization') {
            // Check if following
            // Ideally backend returns this, but for now we iterate 'followers' or check 'following' on authUser
            // Let's check authUser's following list (re-fetch auth user or rely on context if updated)
            const freshAuthUser = await api.get<User>(`/users/${authUser._id}`);
            const followingIds = freshAuthUser.following?.map((u: string | User) => typeof u === 'string' ? u : u._id) || [];
            setIsFollowing(followingIds.includes(targetUserId));
          } else {
            // Check connection status
            // Simple check: is target in my connections?
            const freshAuthUser = await api.get<User>(`/users/${authUser._id}`);
            const myConnectionIds = freshAuthUser.connections?.map((u: string | User) => typeof u === 'string' ? u : u._id) || [];

            if (myConnectionIds.includes(targetUserId)) {
              setConnectionStatus('accepted');
            } else {
              // Check if pending request exists? We assumed 'pending' logic in backend.
              // For MVP, if not connected, we assume 'none' or we'd need a specific endpoint to check request status.
              // The implementation plan says "Implement 'Pending' state". 
              // We don't have an endpoint to check request status specifically yet, 
              // but we can assume 'none' for now or handle the 400 error "Request pending" to update state.
              setConnectionStatus('none');
            }
          }
        } else {
          setConnectionStatus('self');
        }

      } catch (err) {
        console.warn("Failed to load profile from API, trying mock data...", err);

        // Fallback to Mock Data
        const foundUser = getUserById(targetUserId);
        if (foundUser) {
          setTargetUser(foundUser);

          // Mock Connections
          // If viewing self, connections = specific mock users? 
          // For now, let's just return a few random mock users as "connections"
          const mockConnections = MOCK_USERS.filter(u => u._id !== targetUserId).slice(0, 5);
          setConnections(mockConnections);

          // Mock Events
          const mockEvents = getEventsByHost(targetUserId);
          // Transform mock events (which are EventFeedItem) to match what API returns? 
          // The API returns EventFeedItem[], so this matches.
          setEvents(mockEvents);

          // Mock Managed RSOs (if self)
          if (isOwnProfile && authUser) {
            // Return a mock RSO if one exists in MOCK_USERS
            const mockRSOs = MOCK_USERS.filter(u => u.userType === 'organization').slice(0, 1);
            setManagedRSOs(mockRSOs);
          }

          // Mock Social Status
          if (authUser && !isOwnProfile) {
            // Randomize connection status for demo? or just 'none'
            setConnectionStatus('none');
          } else {
            setConnectionStatus('self');
          }

        } else {
          console.error("User not found in mock data either.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [targetUserId, authUser, isOwnProfile]);

  const handleConnect = async () => {
    if (!authUser || !targetUser) return;
    setActionLoading(true);
    try {
      await api.post('/users/request-connection', { recipientId: targetUser._id });
      setConnectionStatus('pending'); // Optimistic update
      alert("Connection request sent!");
    } catch (err) {
      // If error says "already pending", set pending
      console.error(err);
      alert("Failed to connect");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!authUser || !targetUser) return;
    setActionLoading(true);
    try {
      if (isFollowing) {
        await api.post('/users/unfollow-rso', { rsoId: targetUser._id });
        setIsFollowing(false);
      } else {
        await api.post('/users/follow-rso', { rsoId: targetUser._id });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

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
  const eventSummaries = events.map(event => {
    const dateObj = new Date(event.dateTime);
    const isPast = dateObj < new Date();
    const dateStr = dateObj.toLocaleString('en-US', isPast
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
    );

    return {
      id: event._id,
      title: event.title,
      host: event.creatorDetails?.name || targetUser.name,
      datetime: dateStr,
      startsAt: event.dateTime,
      heroImageUrl: event.images?.[0] || '',
      tags: event.tags,
      location: event.location
    };
  });

  const renderActionButton = () => {
    if (isOwnProfile) {
      return (
        <button
          onClick={() => console.log('Edit Profile')}
          className="bg-motion-yellow text-motion-purple font-bold text-xl py-3 px-12 rounded-2xl border-2 border-transparent transition-all hover:border-motion-purple active:bg-motion-orange active:text-white active:border-transparent"
        >
          Edit Profile
        </button>
      );
    }

    if (targetUser.userType === 'organization') {
      return (
        <button
          onClick={handleFollow}
          disabled={actionLoading}
          className={cn(
            "font-bold text-xl py-3 px-12 rounded-2xl border-2 transition-all active:scale-95 flex items-center gap-2",
            isFollowing
              ? "bg-white text-motion-purple border-motion-purple"
              : "bg-motion-yellow text-motion-purple border-transparent hover:border-motion-purple active:bg-motion-orange active:text-white active:border-transparent"
          )}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      );
    }

    // Student
    if (connectionStatus === 'accepted') {
      return (
        <button disabled className="bg-green-100 text-green-700 font-bold text-xl py-3 px-12 rounded-2xl border-2 border-transparent shadow-none cursor-default flex items-center gap-2">
          <HiCheck /> Connected
        </button>
      );
    }

    if (connectionStatus === 'pending') {
      return (
        <button disabled className="bg-gray-200 text-gray-500 font-bold text-xl py-3 px-12 rounded-2xl border-2 border-transparent shadow-none cursor-default">
          Pending
        </button>
      );
    }

    return (
      <button
        onClick={handleConnect}
        disabled={actionLoading}
        className="bg-motion-yellow text-motion-purple font-bold text-xl py-3 px-12 rounded-2xl border-2 border-transparent hover:border-motion-purple active:bg-motion-orange active:text-white active:border-transparent transition-all"
      >
        Connect
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-motion-lavender pb-20">

      {/* Header Section - No white background */}
      <section className="px-12 pt-16 pb-12">
        <div className="max-w-8xl mx-auto flex flex-col md:flex-row items-stretch gap-12">

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
          <div className="flex-1 text-left flex flex-col justify-between py-2">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h1 className="text-5xl font-bold text-black">{targetUser.name}</h1>
                <span className="text-sm font-semibold uppercase tracking-wider text-motion-purple/70">
                  {targetUser.userType === 'organization' ? 'Organization' : 'Student'}
                </span>
              </div>

              <p className="text-xl text-black/80 leading-relaxed max-w-3xl">
                {targetUser.bio || "No bio available."}
              </p>
            </div>

            {/* Action Button & Counts */}
            <div className="pt-4 flex flex-col items-start gap-3">
              <button
                onClick={() => setIsConnectionsListOpen(true)}
                className="text-motion-purple font-bold hover:underline text-lg"
              >
                {displayCount} {connectionListTitle}
              </button>
              {renderActionButton()}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-8xl mx-auto px-12 space-y-16">

        {/* Managed RSOs Section (Using same style as Connections) */}
        {isOwnProfile && managedRSOs.length > 0 && (
          <section>
            <SectionHeader
              title="Managed Organizations"
              action={
                <button className="text-motion-purple italic hover:underline">view all →</button>
              }
            />
            <div className="flex w-full overflow-x-auto pb-4 gap-6">
              {managedRSOs.map((rso) => (
                <div
                  key={rso._id}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                  onClick={() => navigate(`/manage/${rso._id}`)}
                >
                  <div className="h-24 w-24 rounded-full bg-white border-2 border-motion-purple flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                    {rso.avatarUrl ? <img src={rso.avatarUrl} className="h-full w-full object-cover" /> : <HiUser className="text-4xl" />}
                  </div>
                  <span className="font-bold text-motion-purple">{rso.name}</span>
                  <span className="text-xs bg-motion-yellow px-2 py-0.5 rounded-full font-bold text-motion-purple">Manage</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Connections Section - Only show mutual connections when viewing someone else's profile */}
        {targetUser.userType !== 'organization' && !isOwnProfile && (
          <section>
            <SectionHeader
              title={`${connections.length} Mutual Connections`}
              action={
                <button
                  onClick={() => setIsMutualsListOpen(true)}
                  className="text-motion-purple italic hover:underline"
                >
                  view all mutual connections →
                </button>
              }
            />

            {mutualConnections.length > 0 ? (
              <div className={cn("flex w-full overflow-x-auto pb-4 gap-6", mutualConnections.length >= 7 ? "justify-between" : "")}>
                {mutualConnections.slice(0, 7).map((conn, i) => (
                  <div key={i} onClick={() => navigate(`/profile/${conn._id}`)} className="cursor-pointer transition-opacity hover:opacity-80">
                    <AttendeeAvatar name={conn.name} status="Connected" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-black/50 italic">No mutual connections.</div>
            )}
          </section>
        )}

        {/* Events Section */}
        <section>
          <SectionHeader title={targetUser.userType === 'organization' ? "Hosted Events" : "Highlighted Events"} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Create Event Card - First Item if Own Profile */}
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setIsHighlightOverlayOpen(true)}
                className="flex h-full min-h-[120px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[28px] border-2 border-transparent bg-white shadow-[0_4px_4px_rgba(0,0,0,0.15)] transition-all hover:bg-gray-50 hover:shadow-[0_6px_10px_rgba(0,0,0,0.18)] active:border-motion-purple active:shadow-[0_6px_12px_rgba(95,5,137,0.25)]"
              >
                <div className="flex h-20 w-20 items-center justify-center text-motion-lilac">
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="80" width="80" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.75 4.5a.75.75 0 0 1 .75.75V11h5.75a.75.75 0 0 1 0 1.5H12.5v5.75a.75.75 0 0 1-1.5 0V12.5H5.25a.75.75 0 0 1 0-1.5H11V5.25a.75.75 0 0 1 .75-.75Z"></path>
                  </svg>
                </div>
              </button>
            )}

            {eventSummaries.length > 0 ? (
              eventSummaries.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="list"
                  showHost={true}
                  onSelect={(id) => {
                    if (isOwnProfile) {
                      navigate(`/events/${id}/edit`);
                    } else {
                      navigate(`/events/${id}`);
                    }
                  }}
                />
              ))
            ) : (
              !isOwnProfile && <div className="col-span-full text-black/50 italic">No events created.</div>
            )}
          </div>
        </section>

      </div>

      {/* Connections List Overlay */}
      <UserListOverlay
        isOpen={isConnectionsListOpen}
        onClose={() => setIsConnectionsListOpen(false)}
        title={`All ${connectionListTitle}`}
        users={displayList.map(u => ({
          id: u._id,
          name: u.name,
          status: u.userType === 'organization' ? 'Organization' : 'Student'
        }))}
      />

      {/* Mutual Connections Overlay */}
      <UserListOverlay
        isOpen={isMutualsListOpen}
        onClose={() => setIsMutualsListOpen(false)}
        title="Mutual Connections"
        users={mutualConnections.map(u => ({
          id: u._id,
          name: u.name,
          status: 'Connected'
        }))}
      />
      {/* Highlight Event Overlay */}
      {isHighlightOverlayOpen && (
        <HighlightOverlay
          isOpen={isHighlightOverlayOpen}
          onClose={() => setIsHighlightOverlayOpen(false)}
          authUser={authUser as User}
          events={events} // Hosted events
        />
      )}

    </div>
  );
};

// --- Highlight Overlay Component (Refactored for cleanliness) ---

const HighlightOverlay = ({ isOpen, onClose, authUser, events }: { isOpen: boolean; onClose: () => void; authUser: User | null; events: EventFeedItem[] }) => {
  const [activeTab, setActiveTab] = useState<'hosted' | 'rsvped'>('rsvped');
  // const [hostedEvents, setHostedEvents] = useState<EventFeedItem[]>([]); // Removed: Use events prop directly
  // const [hostedEvents, setHostedEvents] = useState<EventFeedItem[]>([]); // Removed: Use events prop directly
  // const [rsvpedEvents, setRsvpedEvents] = useState<EventFeedItem[]>([]); // Removed: Use useMemo
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Tab Animation State
  const tabsRowRef = useRef<HTMLDivElement | null>(null);
  const hostedRef = useRef<HTMLButtonElement | null>(null);
  const rsvpedRef = useRef<HTMLButtonElement | null>(null);
  const [sliderStyle, setSliderStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 });

  // Sync Slider Logic - Updated to match EventFeedList (offsetLeft/offsetWidth)
  const syncSlider = useCallback(() => {
    const target = activeTab === 'hosted' ? hostedRef.current : rsvpedRef.current;

    if (target) {
      setSliderStyle({
        width: target.offsetWidth,
        left: target.offsetLeft,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    syncSlider();
    // Add a small delay to ensure layout
    const timer = setTimeout(syncSlider, 50);
    window.addEventListener('resize', syncSlider);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', syncSlider);
    };
  }, [syncSlider, isOpen]);

  const rsvpedEvents = useMemo(() => {
    if (!isOpen || !authUser) return [];

    // Use shared MOCK_EVENTS and MOCK_RSVPS logic
    const userRsvps = MOCK_RSVPS.filter(r => r.userId === authUser._id && ['going', 'interested', 'waitlist'].includes(r.status));
    const rsvpedIds = new Set(userRsvps.map(r => r.eventId));

    return MOCK_EVENTS.filter(e => rsvpedIds.has(e._id));
  }, [isOpen, authUser]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Sort by Newest -> Oldest
  const currentList = (activeTab === 'hosted' ? events : rsvpedEvents)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 overflow-y-auto"
      onClick={onClose}
    >
      <div className="p-8 min-h-screen">
        <div className="flex justify-end mb-8">
          <button
            onClick={onClose}
            className="text-white text-4xl hover:text-motion-orange transition-colors"
          >
            <HiXMark />
          </button>
        </div>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">Highlight Events</h2>

          {/* Sliding Tabs */}
          <div className="flex justify-center mb-12">
            <div className="relative border-b border-white/20 inline-flex">
              <div ref={tabsRowRef} className="relative flex gap-8">
                <button
                  ref={rsvpedRef}
                  onClick={(e) => { e.stopPropagation(); setActiveTab('rsvped'); }}
                  className={cn(
                    "text-2xl font-bold pb-4 transition-colors px-4",
                    activeTab === 'rsvped' ? "text-white" : "text-white/40 hover:text-white/70"
                  )}
                >
                  RSVP'd Events
                </button>
                <button
                  ref={hostedRef}
                  onClick={(e) => { e.stopPropagation(); setActiveTab('hosted'); }}
                  className={cn(
                    "text-2xl font-bold pb-4 transition-colors px-4",
                    activeTab === 'hosted' ? "text-white" : "text-white/40 hover:text-white/70"
                  )}
                >
                  Hosted by Me
                </button>

                {/* Animated Slider */}
                <span
                  className="absolute bottom-0 h-1 bg-motion-purple transition-all duration-300 ease-out"
                  style={{
                    width: sliderStyle.width,
                    left: sliderStyle.left,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {currentList.length === 0 ? (
              <div className="col-span-full text-center text-white/50 italic text-xl">
                No {activeTab === 'hosted' ? 'hosted' : 'RSVP\'d'} events found.
              </div>
            ) : (
              currentList.map(event => {
                const isSelected = selectedIds.includes(event._id);
                const selectionIndex = selectedIds.indexOf(event._id) + 1;

                const eventDate = new Date(event.dateTime);
                const isPast = eventDate < new Date();
                const formattedDate = eventDate.toLocaleString('en-US',
                  isPast
                    ? { month: 'short', day: 'numeric', year: 'numeric' }
                    : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
                );

                return (
                  <div
                    key={event._id}
                    className="relative group cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); toggleSelection(event._id); }}
                  >
                    {/* Selection Border Only - NO Overlay */}
                    <div className={cn(
                      "absolute inset-0 transition-all rounded-[28px] z-10 pointer-events-none border-4",
                      isSelected ? "border-motion-purple shadow-[0_0_20px_rgba(95,5,137,0.3)]" : "border-transparent group-hover:border-white/10"
                    )} />

                    <EventCard
                      event={{
                        id: event._id,
                        title: event.title,
                        host: event.creatorDetails?.name || 'Me',
                        datetime: formattedDate,
                        heroImageUrl: event.images?.[0] || '/placeholder-event.jpg',
                        location: event.location,
                        tags: event.tags
                      }}
                      variant="list"
                      showHost={false}
                    />

                    {/* Selection Indicator: Numbered Grid */}
                    <div className={cn(
                      "absolute top-4 left-4 z-20 h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all font-bold text-lg shadow-md",
                      isSelected
                        ? "bg-motion-purple border-motion-purple text-white scale-110"
                        : "border-white/50 bg-black/40 text-transparent group-hover:border-white group-hover:text-white/30"
                    )}>
                      {isSelected ? selectionIndex : (selectedIds.length + 1)}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Action Bar */}
          {selectedIds.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-motion-plum text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4">
              <span className="font-bold">{selectedIds.length} Selected</span>
              <div className="h-6 w-px bg-white/20" />
              <button
                onClick={(e) => { e.stopPropagation(); console.log("Saving highlights:", selectedIds); onClose(); }}
                className="font-bold text-motion-yellow hover:text-white transition-colors"
              >
                Save to Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
