import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { HiBookmark, HiOutlineBookmark, HiXMark } from 'react-icons/hi2';
import { TiLocation } from 'react-icons/ti';
import { TfiLayoutGrid2Alt } from 'react-icons/tfi';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../hooks/useSocial';
import type { EventSummary, EventDetail, User, EventFeedItem } from '../types';
import EventCard from '../components/EventCard';
import { motionTheme, cn } from '../theme';
import UserListOverlay from '../components/UserListOverlay';
import AttendeeAvatar from '../components/AttendeeAvatar';
import SectionHeader from '../components/SectionHeader';
import LoadingScreen from '../components/LoadingScreen';

type RSVPStatus = 'going' | 'interested' | 'waitlist' | null;

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [now] = useState(() => Date.now());

  // Scroll to top on mount or eventId change
  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
  }, [eventId]);

  const [userRsvpStatus, setUserRsvpStatus] = useState<RSVPStatus>(null);
  const [eventCapacity] = useState<{ current: number; max: number }>({ current: 25, max: 30 });
  const isCapacityFull = eventCapacity.current >= eventCapacity.max;

  // Gallery state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentGalleryPage, setCurrentGalleryPage] = useState(0);

  const IMAGES_PER_PAGE = 3;

  const [isAttendeesListOpen, setIsAttendeesListOpen] = useState(false);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const hostUser: User | null = event ? {
    _id: event.hostDetails.id,
    name: event.hostDetails.name,
    email: '',
    handle: '',
    userType: event.hostDetails.userType || 'individual',
    avatarUrl: event.hostDetails.avatarUrl,
    bio: event.hostDetails.bio
  } : null;

  const { connectionStatus, isFollowing, handleConnect, handleFollow, loading: socialLoading } = useSocial(hostUser);

  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      setLoading(true);
      try {
        const eventData = await apiClient.get<EventFeedItem>(`/events/${eventId}`);
        if (!eventData) throw new Error('Event not found');

        // Extract creator details from the various possible shapes
        const raw = eventData as EventFeedItem & { hostDetails?: User };
        let creator: Partial<User> = raw.creatorDetails || raw.hostDetails || (typeof raw.createdBy === 'object' ? raw.createdBy as User : {});

        if (!creator.name && typeof eventData.createdBy === 'string') {
          try {
            creator = await apiClient.get<User>(`/users/${eventData.createdBy}`);
          } catch { /* use partial creator */ }
        }

        const otherEventsData = await apiClient.get<EventFeedItem[]>(`/events?createdBy=${creator._id}&limit=3`);

        const transformed: EventDetail = {
          id: eventData._id,
          title: eventData.title,
          host: creator.name || 'Unknown Host',
          datetime: new Date(eventData.dateTime).toLocaleString(),
          startsAt: eventData.dateTime,
          distance: eventData.distance ? `${(eventData.distance / 1000).toFixed(1)} km` : undefined,
          tags: eventData.tags || [],
          heroImageUrl: eventData.images?.[0] || '/placeholder-event.jpg',
          location: {
            coordinates: eventData.location?.coordinates || [0, 0],
            address: eventData.location?.address
          },
          description: eventData.description || 'No description provided.',
          attendeeCount: eventData.participantCount || 0,
          attendees: [],
          galleryImages: eventData.images || [],
          hostDetails: {
            id: creator._id || '',
            name: creator.name || 'Unknown',
            avatarUrl: creator.avatarUrl || '',
            mutualConnections: 0,
            bio: creator.bio || '',
            userType: creator.userType
          },
          otherEventsByHost: otherEventsData
            .filter((e: EventFeedItem) => e._id !== eventData._id)
            .slice(0, 3)
            .map((e: EventFeedItem) => ({
              id: e._id,
              title: e.title,
              host: creator.name || 'Unknown',
              datetime: format(new Date(e.dateTime), 'MMM d @ h:mm a'),
              heroImageUrl: e.images?.[0] || '',
              location: {
                coordinates: e.location?.coordinates,
                address: e.location?.address
              },
              tags: e.tags || []
            })),
          similarEvents: []
        };

        setEvent(transformed);
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleRsvpAction = (action: 'going' | 'interested' | 'waitlist' | 'cancel' | 'remove') => {
    switch (action) {
      case 'going':
        if (isCapacityFull) {
          setUserRsvpStatus('waitlist');
        } else {
          setUserRsvpStatus('going');
        }
        break;
      case 'interested':
        setUserRsvpStatus('interested');
        break;
      case 'waitlist':
        setUserRsvpStatus('waitlist');
        break;
      case 'cancel':
      case 'remove':
        setUserRsvpStatus(null);
        break;
    }
  };

  const renderRSVPButtons = () => {
    // User has not RSVPed
    if (!userRsvpStatus) {
      return (
        <div className="flex gap-3 items-center w-full">
          {/* Primary: RSVP (or Join Waitlist if full) */}
          <button
            onClick={() => handleRsvpAction(isCapacityFull ? 'waitlist' : 'going')}
            className={cn(
              "flex-1 rounded-2xl py-2 text-center text-2xl font-bold text-white transition-colors border-2 border-transparent",
              "bg-motion-purple",
              "hover:border-motion-orange",
              "active:bg-motion-orange active:border-motion-orange"
            )}
          >
            {isCapacityFull ? 'Join Waitlist' : 'RSVP'}
          </button>
          {/* Secondary: Bookmark (Interested) - Outline icon when not interested */}
          <button
            onClick={() => handleRsvpAction('interested')}
            className={cn(
              "rounded-xl p-3 transition-colors border-2 border-transparent",
              "bg-motion-yellow",
              "hover:border-motion-orange",
              "active:bg-motion-orange active:border-motion-orange"
            )}
          >
            <HiOutlineBookmark className="text-3xl text-motion-purple" />
          </button>
        </div>
      );
    }

    // User is Going
    if (userRsvpStatus === 'going') {
      return (
        <div className="flex gap-3 items-center w-full">
          {/* RSVP active state with hover to cancel */}
          <button
            onClick={() => handleRsvpAction('cancel')}
            className={cn(
              "group flex-1 rounded-2xl py-2 text-center text-2xl font-bold text-white transition-colors border-2 border-transparent",
              "bg-motion-purple",
              "hover:border-motion-orange",
              "active:bg-motion-orange active:border-motion-orange"
            )}
          >
            <span className="group-hover:hidden">RSVPed</span>
            <span className="hidden group-hover:inline">Cancel RSVP</span>
          </button>
          {/* Bookmark button for saving while going */}
          <button
            onClick={() => handleRsvpAction('interested')}
            className={cn(
              "rounded-xl p-3 transition-colors border-2 border-transparent",
              "bg-motion-yellow",
              "hover:border-motion-orange",
              "active:bg-motion-orange active:border-motion-orange"
            )}
          >
            <HiOutlineBookmark className="text-3xl text-motion-purple" />
          </button>
        </div>
      );
    }

    // User is Interested
    if (userRsvpStatus === 'interested') {
      return (
        <div className="flex gap-3 items-center w-full">
          {/* Primary: Upgrade to RSVP (if capacity allows) */}
          <button
            onClick={() => handleRsvpAction(isCapacityFull ? 'waitlist' : 'going')}
            className={cn(
              "flex-1 rounded-2xl py-2 text-center text-2xl font-bold text-white transition-colors border-2 border-transparent",
              "bg-motion-purple",
              "hover:border-motion-orange",
              "active:bg-motion-orange active:border-motion-orange"
            )}
          >
            {isCapacityFull ? 'Join Waitlist' : 'RSVP'}
          </button>
          {/* Secondary */}
          <button
            onClick={() => handleRsvpAction('remove')}
            className={cn(
              "group rounded-xl p-3 transition-colors border-2 border-transparent",
              "bg-motion-yellow",
              "hover:border-motion-orange",
              "active:bg-motion-orange active:border-motion-orange"
            )}
          >
            <HiBookmark className="text-3xl text-motion-purple group-hover:hidden" />
            <HiXMark className="text-3xl text-motion-purple hidden group-hover:block" />
          </button>
        </div>
      );
    }

    // User is on Waitlist
    if (userRsvpStatus === 'waitlist') {
      return (
        <div className="flex gap-3 items-center w-full">
          {/* Leave Waitlist */}
          <button
            onClick={() => handleRsvpAction('cancel')}
            className={cn(
              "flex-1 rounded-2xl py-2 text-center text-2xl font-bold transition-colors border-2",
              "bg-white text-motion-purple border-motion-purple",
              "hover:border-motion-orange hover:text-motion-orange",
              "active:bg-motion-orange active:text-white active:border-motion-orange"
            )}
          >
            Leave Waitlist
          </button>
          {/* Still offer Interested - Outline bookmark */}
          <button
            onClick={() => handleRsvpAction('interested')}
            className={cn(
              "rounded-xl p-3 transition-colors border-2 border-transparent",
              "bg-motion-yellow",
              "hover:border-motion-orange",
              "active:bg-motion-orange active:border-motion-orange"
            )}
          >
            <HiOutlineBookmark className="text-3xl text-motion-purple" />
          </button>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <LoadingScreen message="Loading Event..." />
    )
  }

  if (!event) return <div className="p-12 text-center text-xl">Event not found</div>;

  const dateStr = event.startsAt || event.datetime;
  let formattedDate = 'Date TBA';
  try {
    const d = parseISO(dateStr);
    formattedDate = format(d, 'M/d @ h:mm a');
  } catch (e) {
    console.error('Date parsing error', e);
  }

  return (
    <div className="min-h-screen pb-20 bg-motion-lavender">

      {/* --- Header / Hero Section --- */}
      <div className="pb-8 pt-12 px-12">
        <div className="max-w-8xl mx-auto">
          {/* Top Bar (simulated nav space if needed, or just spacers) */}

          <div className="flex flex-col lg:flex-row gap-12 mt-4">
            {/* Left Column: Info */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Title, Tags & Host */}
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-black leading-[1.1]">
                  {event.title}
                </h1>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {event.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-4 py-1 rounded-full bg-motion-lilac text-motion-purple font-medium text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Host Name - Linked */}
                <h2 className="text-3xl font-bold text-black mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${event.hostDetails.id}`);
                    }}
                    className="hover:text-motion-purple transition-colors text-left"
                  >
                    {event.hostDetails.name}
                  </button>
                </h2>
              </div>

              {/* Location */}
              <div className="mt-6 text-xl italic text-black leading-relaxed font-serif">
                {event.location?.address || 'Address TBA'}
              </div>

              {/* Description */}
              <p className="mt-6 text-lg text-black leading-relaxed whitespace-pre-wrap flex-grow">
                {event.description}
              </p>

              {/* RSVP Actions */}
              <div className="pt-8 mt-auto">
                {renderRSVPButtons()}
              </div>
            </div>

            {/* Right Column: Hero Image */}
            <div className="flex-1 flex flex-col relative">
              <div
                className="relative h-full w-full rounded-[40px] overflow-hidden min-h-[400px] cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setSelectedImage(event.heroImageUrl)}
              >
                <img
                  src={event.heroImageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-8 right-8 bg-motion-orange text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg">
                  {formattedDate}
                </div>
              </div>
              <div className="absolute top-full left-0 mt-3 flex items-center gap-4">
                {user && event.hostDetails.id === user._id ? (
                  /* Host View: Edit Event */
                  <button
                    onClick={() => navigate(`/events/${event.id}/edit`)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-black bg-transparent border-none shadow-none hover:underline transition-opacity"
                  >
                    Edit Event <TiLocation className="text-motion-purple text-xl" />
                  </button>
                ) : (
                  /* Guest View: Switch to Map View */
                  event.startsAt && new Date(event.startsAt).getTime() > now && (
                    <button
                      onClick={() => navigate(`/events?eventId=${event.id}`)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-black bg-transparent border-none shadow-none hover:opacity-80 transition-opacity"
                    >
                      Switch to Map View <TiLocation className="text-motion-purple text-xl" />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-12 space-y-16 mt-12">

        {/* --- Attendees Section --- */}
        <section>
          <SectionHeader
            title={`${event.attendeeCount} Attendees`}
            action={
              <button
                onClick={() => setIsAttendeesListOpen(true)}
                className="text-motion-purple italic hover:underline"
              >
                view all attendees →
              </button>
            }
          />

          <div className={cn("flex w-full overflow-x-auto pb-4 gap-6", event.attendees.length >= 7 ? "justify-between" : "")}>
            {event.attendees.slice(0, 7).map((attendee, i) => (
              <div key={i} onClick={() => navigate(`/profile/${attendee.id}`)} className="cursor-pointer transition-opacity hover:opacity-80">
                <AttendeeAvatar name={attendee.name} status={attendee.status} />
              </div>
            ))}
          </div>
        </section>

        {/* --- Gallery Section --- */}
        <section>
          <SectionHeader
            title="Gallery"
            action={
              <button onClick={() => setIsGalleryOpen(true)} className="text-motion-purple text-2xl hover:opacity-80 transition-opacity">
                <TfiLayoutGrid2Alt />
              </button>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {event.galleryImages
              .slice(currentGalleryPage * IMAGES_PER_PAGE, (currentGalleryPage + 1) * IMAGES_PER_PAGE)
              .map((img: string, i: number) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-2xl overflow-hidden shadow-md cursor-pointer"
                  onClick={() => setSelectedImage(img)}
                >
                  <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
          </div>

          {/* Pagination Indicators */}
          {event.galleryImages.length > IMAGES_PER_PAGE && (
            <div className="flex justify-center gap-4 mt-8">
              {Array.from({ length: Math.ceil(event.galleryImages.length / IMAGES_PER_PAGE) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentGalleryPage(i)}
                  className={cn(
                    "w-4 h-4 rounded-full shadow-md transition-all duration-300",
                    i === currentGalleryPage
                      ? "bg-motion-purple scale-110"
                      : "bg-white hover:bg-gray-50 bg-opacity-90 active:scale-95"
                  )}
                  aria-label={`Go to gallery page ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* --- About the Host Section --- */}
        <section>
          <h3 className="text-3xl font-bold text-motion-plum mb-8">About the Host</h3>

          <div className={cn("bg-white rounded-[32px] p-8 md:p-12", motionTheme.shadows.soft)}>
            <div className="flex flex-col md:flex-row gap-12 text-lg">
              {/* Host Card */}
              <div className="md:w-auto flex flex-row items-center gap-6 text-left shrink-0">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg shrink-0">
                  <img src={event.hostDetails.avatarUrl} alt={event.hostDetails.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h4
                    className="text-[28px] font-bold text-motion-plum mb-1 cursor-pointer hover:underline hover:text-motion-purple transition-colors"
                    onClick={() => navigate(`/profile/${event.hostDetails.id}`)}
                  >
                    {event.hostDetails.name}
                  </h4>
                  <p className="font-medium mb-4">{event.hostDetails.mutualConnections} mutual followers</p>
                  {event.hostDetails.userType === 'organization' ? (
                    <button
                      onClick={handleFollow}
                      disabled={socialLoading}
                      className={cn(
                        "bg-motion-yellow text-motion-purple font-bold py-2 px-16 rounded-full border-2 border-transparent transition-all shadow-sm",
                        "hover:border-motion-purple active:bg-motion-orange active:text-white active:border-motion-orange",
                        isFollowing && "bg-motion-lilac border-motion-purple"
                      )}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={socialLoading || connectionStatus === 'accepted' || connectionStatus === 'pending'}
                      className={cn(
                        "bg-motion-yellow text-motion-purple font-bold py-2 px-16 rounded-full border-2 border-transparent transition-all shadow-sm",
                        "hover:border-motion-purple active:bg-motion-orange active:text-white active:border-motion-orange",
                        connectionStatus === 'accepted' && "bg-green-100 text-green-700 border-green-200 cursor-default",
                        connectionStatus === 'pending' && "bg-gray-100 text-gray-500 border-gray-200 cursor-default"
                      )}
                    >
                      {connectionStatus === 'accepted' ? 'Connected' : connectionStatus === 'pending' ? 'Pending' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>

              {/* Host Bio */}
              <div className="md:w-2/3 space-y-6">
                <p className="leading-relaxed whitespace-pre-wrap text-motion-plum/90">
                  {event.hostDetails.bio}
                </p>
              </div>
            </div>

            {/* Other Events by Host */}
            <div className="mt-12">
              <h4 className="text-2xl font-bold text-motion-plum mb-6">Other Events By This Host</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {event.otherEventsByHost.map((evt: EventSummary) => (
                  <div key={evt.id} className="min-w-[280px]">
                    <EventCard
                      event={evt}
                      variant="list"
                      showHost={false}
                      onSelect={(id) => navigate(`/events/${id}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- Similar Events --- */}
        <section>
          <h3 className="text-3xl font-bold text-motion-plum mb-8">Similar Events</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {event.similarEvents.map((evt: EventSummary) => (
              <div key={evt.id} className="min-w-[280px]">
                <EventCard
                  event={evt}
                  variant="list"
                  showTags={true}
                  onSelect={(id) => navigate(`/events/${id}`)}
                />
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* --- Image Modals --- */}

      {/* Single Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-motion-orange transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <HiXMark />
          </button>
          <img
            src={selectedImage}
            alt="Enlarged view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Full Gallery Overlay */}
      {isGalleryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 overflow-y-auto"
          onClick={() => setIsGalleryOpen(false)}
        >
          <div className="p-8 min-h-screen">
            <div className="flex justify-end mb-8">
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="text-white text-4xl hover:text-motion-orange transition-colors"
              >
                <HiXMark />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-8xl mx-auto">
              {event.galleryImages.map((img: string, i: number) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl overflow-hidden shadow-md cursor-pointer hover:opacity-80 transition-opacity border border-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(img);
                  }}
                >
                  <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attendees List Overlay */}
      <UserListOverlay
        isOpen={isAttendeesListOpen}
        onClose={() => setIsAttendeesListOpen(false)}
        title={`All Attendees (${event.attendeeCount})`}
        users={event.attendees.map(a => ({
          id: a.id,
          name: a.name,
          status: a.status
        }))}
      />
    </div>
  );
};

export default EventDetailPage;
