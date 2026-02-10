import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { HiBookmark, HiOutlineBookmark, HiXMark, HiUser, HiMagnifyingGlass } from 'react-icons/hi2';
import { TiLocation } from 'react-icons/ti';
import { TfiLayoutGrid2Alt } from 'react-icons/tfi';
import type { EventSummary, EventDetail } from '../types';
import { getEventById, getEventAttendees, getEventsByHost, getSimilarEvents } from '../data/mockData';
import EventCard from '../components/EventCard';
import { motionTheme, cn } from '../theme';

// --- Sub-components (could receive their own files later) ---

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

type RSVPStatus = 'going' | 'interested' | 'waitlist' | null;

// --- Main Page Component ---

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Capture "now" at mount/render time purely to avoid purity lint errors
  const [now] = useState(() => Date.now());

  // Scroll to top on mount or eventId change
  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
  }, [eventId]);

  // Mock RSVP status - in production, fetch this from API based on event.id
  const [userRsvpStatus, setUserRsvpStatus] = useState<RSVPStatus>(null);

  // Mock event capacity data - in production, fetch from event details
  const [eventCapacity] = useState<{ current: number; max: number }>({ current: 25, max: 30 });
  const isCapacityFull = eventCapacity.current >= eventCapacity.max;

  // Gallery state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentGalleryPage, setCurrentGalleryPage] = useState(0);

  const IMAGES_PER_PAGE = 3;

  // Attendees modal state
  const [isAttendeesListOpen, setIsAttendeesListOpen] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState('');

  // Load event data using useMemo
  const event = useMemo<EventDetail | null>(() => {
    if (!eventId) return null;
    const found = getEventById(eventId);

    if (found) {
      // Fetch dynamic data
      const attendees = getEventAttendees(found._id);
      const otherEvents = getEventsByHost(found.creatorDetails?._id || '');
      const similarEvents = getSimilarEvents(found._id);

      // Transform raw data to EventDetail
      return {
        id: found._id,
        title: found.title,
        host: found.creatorDetails?.name || 'Unknown Host',
        datetime: new Date(found.dateTime).toLocaleString(),
        startsAt: found.dateTime,
        distance: found.distance ? `${(found.distance / 1000).toFixed(1)} km` : undefined,
        tags: found.tags || [],
        heroImageUrl: found.images?.[0] || '/placeholder-event.jpg',
        location: {
          coordinates: found.location.coordinates,
          address: found.location.address
        },
        // Details
        description: found.description || "No description provided.",
        attendeeCount: found.participantCount || 0,
        attendees: attendees
          .filter(a => a.status === 'going')
          .map(a => ({
            id: a._id,
            name: a.name,
            avatarUrl: a.avatarUrl,
            status: a.status as 'following' | 'going' | 'interested'
          })),
        // Tripling images for pagination demo purposes
        galleryImages: found.images ? [...found.images, ...found.images, ...found.images, ...found.images] : [],
        hostDetails: {
          id: found.creatorDetails?._id || 'h0',
          name: found.creatorDetails?.name || 'Unknown',
          avatarUrl: found.creatorDetails?.avatarUrl || found.images?.[0] || '',
          mutualConnections: 0,
          bio: found.creatorDetails?.bio || 'No bio available.'
        },
        otherEventsByHost: otherEvents
          .filter(e => e._id !== found._id) // Exclude current event
          .slice(0, 3) // Limit to 3 events
          .map(e => ({
            id: e._id,
            title: e.title,
            host: e.creatorDetails?.name || 'Unknown',
            datetime: format(new Date(e.dateTime), 'MMM d @ h:mm a'),
            heroImageUrl: e.images?.[0] || '',
            location: {
              coordinates: e.location.coordinates,
              address: e.location.address
            },
            tags: e.tags || []
          })),
        similarEvents: similarEvents.map(e => ({
          id: e._id,
          title: e.title,
          host: e.creatorDetails?.name || 'Unknown',
          datetime: format(new Date(e.dateTime), 'MMM d @ h:mm a'),
          heroImageUrl: e.images?.[0] || '',
          location: {
            coordinates: e.location.coordinates,
            address: e.location.address
          },
          tags: e.tags || []
        }))
      };
    }
    return null;
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

  if (!event) return null; // Or loading spinner

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

                {/* Tags Section */}
                <div className="flex gap-2">
                  {event.tags?.map((tag: string) => (
                    <span key={tag} className="px-4 py-1 rounded-full bg-motion-lilac text-motion-purple font-medium text-sm">
                      {tag}
                    </span>
                  ))}
                </div>

                <h2 className="text-3xl font-bold text-black">
                  {event.hostDetails.name}
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
              <div className="absolute top-full left-0 mt-3">
                {event.startsAt && new Date(event.startsAt).getTime() > now && (
                  <button
                    onClick={() => navigate(`/events?eventId=${event.id}`)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-black bg-transparent border-none shadow-none hover:opacity-80 transition-opacity"
                  >
                    Switch to Map View <TiLocation className="text-motion-purple text-xl" />
                  </button>
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
              <AttendeeAvatar key={i} name={attendee.name} status={attendee.status} />
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
                  <h4 className="text-[28px] font-bold text-motion-plum mb-1">{event.hostDetails.name}</h4>
                  <p className="font-medium mb-4">{event.hostDetails.mutualConnections} mutual followers</p>
                  <button className="bg-motion-yellow text-motion-purple font-bold py-2 px-16 rounded-full border-2 border-transparent hover:border-motion-purple active:bg-motion-orange active:text-white active:border-motion-orange transition-all shadow-sm">
                    Follow
                  </button>
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
      {isAttendeesListOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 overflow-y-auto"
          onClick={() => setIsAttendeesListOpen(false)}
        >
          <div className="p-8 min-h-screen">
            <div className="flex justify-end mb-8">
              <button
                onClick={() => setIsAttendeesListOpen(false)}
                className="text-white text-4xl hover:text-motion-orange transition-colors"
              >
                <HiXMark />
              </button>
            </div>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-white mb-8 text-center">All Attendees ({event.attendeeCount})</h2>

              {/* Search Input */}
              <div
                className="relative mb-8"
                onClick={(e) => e.stopPropagation()}
              >
                <HiMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 text-xl" />
                <input
                  type="text"
                  placeholder="Search attendees..."
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/60 focus:outline-none focus:border-motion-purple focus:ring-1 focus:ring-motion-purple transition-all"
                />
              </div>

              <div className="flex flex-col gap-4">
                {event.attendees
                  .filter(a => a.name.toLowerCase().includes(attendeeSearch.toLowerCase()))
                  .map((attendee, i) => (
                    <div key={i} className="flex items-center gap-6 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-4xl text-[#d8b4fe] shrink-0">
                        <HiUser />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xl font-bold text-white">{attendee.name}</span>
                        <span className="text-sm font-medium text-white/70 uppercase tracking-wide">
                          {attendee.status === 'following' ? 'Following' : attendee.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
