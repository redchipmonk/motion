import { useNavigate } from 'react-router-dom';
import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { FaFilter } from 'react-icons/fa';
import { HiArrowLongLeft, HiArrowLongRight } from 'react-icons/hi2';
import EventCard from '../components/EventCard';
import { motionTheme, cn } from '../theme';
import { MOCK_EVENTS, MOCK_RSVPS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { FilterPanel, type SortOption, type TimeOption } from '../components/FilterPanel';
import { EVENT_TAGS } from '../constants';
import type { EventSummary, EventFeedItem } from '../types';

type Tab = 'rsvped' | 'hosted';

// Helper to transform raw event data into UI-ready EventSummary
const transformEvent = (event: EventFeedItem): EventSummary => ({
  id: event._id,
  title: event.title,
  host: event.creatorDetails?.name || 'Unknown Host',
  datetime: format(new Date(event.dateTime), 'MMM d @ h:mm a'),
  startsAt: event.dateTime,
  distance: event.distance ? `${(event.distance / 1000).toFixed(1)} km` : undefined,
  tags: event.tags || [],
  heroImageUrl: event.images?.[0] || '/placeholder-event.jpg',
  status: event.status || 'draft', // Default to draft if not specified
  location: {
    coordinates: event.location.coordinates
  }
});

const ITEMS_PER_PAGE = 6;

const MyEventsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('rsvped');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timeWindow, setTimeWindow] = useState<TimeOption>('any');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const allTags = Array.from(EVENT_TAGS).sort((a, b) => a.localeCompare(b));

  // Sliding Tab Animation Refs & State
  const tabsRowRef = useRef<HTMLDivElement | null>(null);
  const rsvpedRef = useRef<HTMLButtonElement | null>(null);
  const hostedRef = useRef<HTMLButtonElement | null>(null);
  const [sliderStyle, setSliderStyle] = useState<{ width: number; x: number }>({ width: 0, x: 0 });

  // Stable ref for resize listener
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const syncSlider = (tab: Tab = activeTabRef.current) => {
    const container = tabsRowRef.current;
    const target = (tab === 'rsvped' ? rsvpedRef.current : hostedRef.current) ?? null;
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setSliderStyle({
      width: targetRect.width,
      x: targetRect.left - containerRect.left,
    });
  };

  useLayoutEffect(() => {
    syncSlider(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const onResize = () => syncSlider();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Filter Logic
  const validEvents = useMemo(() => {
    if (!user) return [];

    let baseList: EventFeedItem[] = [];

    // 1. Filter by Tab (Source)
    if (activeTab === 'hosted') {
      baseList = MOCK_EVENTS.filter((e) => e.creatorDetails?._id === user._id);
    } else {
      const userRsvps = MOCK_RSVPS.filter(
        (r) => r.userId === user._id && ['going', 'interested', 'waitlist'].includes(r.status)
      );
      const rsvpedEventIds = new Set(userRsvps.map((r) => r.eventId));
      baseList = MOCK_EVENTS.filter((e) => rsvpedEventIds.has(e._id));
    }

    // Deduplicate
    baseList = Array.from(new Map(baseList.map(item => [item._id, item])).values());

    // 2. Filter by Search & Tags
    const lowerSearch = searchTerm.trim().toLowerCase();
    const filtered = baseList.filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(lowerSearch);
      const eventTags = event.tags ?? [];
      const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => eventTags.includes(tag));
      return matchesSearch && matchesTags;
    });

    // 3. Sort (Basic Implementation)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      if (sortBy === 'soonest') return dateA - dateB;
      return dateA - dateB;
    }).map(transformEvent);
  }, [activeTab, user, searchTerm, selectedTags, sortBy]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, selectedTags, timeWindow, sortBy]);

  // Pagination Logic
  // For 'hosted' tab, the first page has 5 events + 1 "Create" button.
  // Subsequent pages have 6 events.
  // For 'rsvped', all pages have 6 events.
  const showCreateButton = activeTab === 'hosted' && !searchTerm && selectedTags.length === 0; // Only show on default view? Or always? Let's show always for hosted tab logic, but maybe suppress if searching?
  // Let's stick to simple: Always show create button card in Hosted tab.

  // Calculate total pages
  // This is slightly complex with variable items per page.
  // Simplified: Treat "Create Button" as an item in the list for calculation?
  // Easier approach: Just slice logic.

  const getPaginatedEvents = () => {
    let startIndex = 0;
    if (showCreateButton) {
      if (currentPage === 1) {
        return validEvents.slice(0, 5);
      }
      startIndex = 5 + (currentPage - 2) * 6;
    } else {
      startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    }
    return validEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const paginatedEvents = getPaginatedEvents();

  const totalEvents = validEvents.length;
  const totalPages = showCreateButton
    ? Math.ceil((totalEvents + 1) / ITEMS_PER_PAGE)
    : Math.ceil(totalEvents / ITEMS_PER_PAGE);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setTimeWindow('any');
    setSortBy('recommended');
  };

  const appliedCount = selectedTags.length + (timeWindow !== 'any' ? 1 : 0) + (sortBy !== 'recommended' ? 1 : 0);

  return (
    <section className="relative flex h-full flex-col bg-motion-warmWhite">
      {/* Decorative Circles */}
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 overflow-hidden md:block" aria-hidden>
        <span className={cn('absolute -right-16 -top-16 h-80 w-80 rounded-full', motionTheme.accents.orangeCircle)} />
        <span className="absolute right-32 -top-24 h-80 w-80 rounded-full bg-motion-yellow" />
        <span className={cn('absolute right-64 -top-32 h-80 w-80 rounded-full', motionTheme.accents.lilacCircle)} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 flex-col px-8 py-8 md:px-12">
        <header className="mb-8 space-y-6">
          <h1 className="text-[40px] font-bold leading-tight text-motion-plum">My Events</h1>

          {/* Search Bar Row */}
          <div className="flex w-[75%] items-center gap-3">
            <label htmlFor="my-events-search" className="sr-only">
              Search my events
            </label>

            {/* Search Input Container */}
            <div
              className={cn(
                'group relative flex-1 rounded-full border bg-white transition-colors',
                motionTheme.borders.authInput,
                motionTheme.shadows.soft,
                motionTheme.states.formFocusBorder,
                motionTheme.shadows.focusWithin,
              )}
            >
              {/* Search Icon */}
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-motion-plum/50 transition group-focus-within:text-motion-purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.65" y1="16.65" x2="21" y2="21" />
                </svg>
              </span>
              <input
                id="my-events-search"
                type="search"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="peer h-11 w-full rounded-full bg-transparent pl-11 pr-4 text-sm font-medium text-motion-plum placeholder-motion-plum/60 outline-none transition focus:placeholder-transparent"
              />
            </div>

            {/* Filter Button with Badge */}
            <button
              type="button"
              className="relative text-motion-purple"
              aria-label="Open filters"
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <FaFilter size={18} />
              {/* Badge showing count of applied filters */}
              {appliedCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-motion-orange px-1 text-[11px] font-bold text-white">
                  {appliedCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="relative border-b border-motion-plum/15">
            <div ref={tabsRowRef} className="flex gap-10">
              <button
                ref={rsvpedRef}
                type="button"
                onClick={() => setActiveTab('rsvped')}
                className={cn(
                  'pb-3 text-sm font-semibold transition-colors',
                  activeTab === 'rsvped' ? 'text-motion-plum' : 'text-motion-plum/60 hover:text-motion-plum',
                )}
              >
                RSVPed
              </button>
              <button
                ref={hostedRef}
                type="button"
                onClick={() => setActiveTab('hosted')}
                className={cn(
                  'pb-3 text-sm font-semibold transition-colors',
                  activeTab === 'hosted' ? 'text-motion-plum' : 'text-motion-plum/60 hover:text-motion-plum',
                )}
              >
                Hosted
              </button>

              {/* Animated Sliding Underline */}
              <span
                aria-hidden
                className="absolute bottom-0 h-[3px] rounded-full bg-motion-purple transition-[transform,width] duration-300 ease-out"
                style={{
                  width: sliderStyle.width,
                  transform: `translateX(${sliderStyle.x}px)`,
                }}
              />
            </div>
          </div>
        </header>

        {/* Events Grid */}
        <div className="pb-4">
          {validEvents.length === 0 && !showCreateButton ? null : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Create Event Button (First item on Page 1 of Hosted) */}
              {showCreateButton && currentPage === 1 && (
                <button
                  type="button"
                  onClick={() => navigate('/add-event')}
                  className="flex h-[180px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[28px] border-2 border-transparent bg-white shadow-[0_4px_4px_rgba(0,0,0,0.15)] transition-all hover:bg-gray-50 hover:shadow-[0_6px_10px_rgba(0,0,0,0.18)] active:border-motion-purple active:shadow-[0_6px_12px_rgba(95,5,137,0.25)]"
                >
                  <div className="flex h-16 w-16 items-center justify-center text-motion-lilac">
                    {/* GoPlus icon mostly matches "Create Event" plus style */}
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="64" width="64" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.75 4.5a.75.75 0 0 1 .75.75V11h5.75a.75.75 0 0 1 0 1.5H12.5v5.75a.75.75 0 0 1-1.5 0V12.5H5.25a.75.75 0 0 1 0-1.5H11V5.25a.75.75 0 0 1 .75-.75Z"></path>
                    </svg>
                  </div>
                </button>
              )}

              {paginatedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="list"
                  variantMode={activeTab === 'hosted' ? 'hosted' : 'default'}
                  isActive={selectedEventId === event.id}
                  onSelect={(id) => {
                    setSelectedEventId(id);
                    // Navigate based on active tab
                    if (activeTab === 'hosted') {
                      navigate(`/events/${id}/edit`);
                    } else {
                      navigate(`/events/${id}`);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer - Anchored to bottom */}
        <div className="mt-auto flex justify-center py-8">
          {totalPages > 0 && (totalEvents > 0 || showCreateButton) && (
            <div className="flex items-center gap-4">
              {/* Previous Arrow - Hidden on first page */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "text-motion-plum transition-colors hover:text-motion-purple disabled:invisible",
                  currentPage === 1 && "invisible"
                )}
                aria-label="Previous page"
              >
                <HiArrowLongLeft size={32} strokeWidth={.00001} className="scale-x-150" />
              </button>

              {/* Page Status */}
              <span className="text-sm font-medium text-motion-plum">
                Page {currentPage} of {totalPages}
              </span>

              {/* Next Arrow - Hidden on last page */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "text-motion-plum transition-colors hover:text-motion-purple disabled:invisible",
                  currentPage === totalPages && "invisible"
                )}
                aria-label="Next page"
              >
                <HiArrowLongRight size={32} strokeWidth={.00001} className="scale-x-150" />
              </button>
            </div>
          )}
        </div>

        {/* Filter Panel Modal */}
        <FilterPanel
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          timeWindow={timeWindow}
          setTimeWindow={setTimeWindow}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
          sortBy={sortBy}
          setSortBy={setSortBy}
          allTags={allTags}
          onClear={clearFilters}
          onApply={() => setFiltersOpen(false)}
        />
      </div>
    </section>
  );
};

export default MyEventsPage;
