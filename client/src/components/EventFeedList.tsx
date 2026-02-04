/**
 * @file Scrollable event feed list with filtering and grouping.
 * 
 * Displays events in a vertical scrollable list with search, tabs (upcoming/past),
 * and filter panel integration. Uses date-fns for date formatting.
 * 
 * @example
 * <EventFeedList events={events} onSelectEvent={setSelectedEvent} />
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { FaFilter } from 'react-icons/fa';
import EventCard from './EventCard';
import { motionTheme, cn } from '../theme';
import { FilterPanel, type SortOption, type TimeOption } from './FilterPanel';
import { EVENT_TAGS } from '../constants';
import type { EventSummary } from '../types';

type EventFeedListProps = {
  /** Array of events to display. Falls back to MOCK_EVENTS if not provided. */
  events?: EventSummary[];
  /** Callback fired when user selects an event from the list. */
  onSelectEvent?: (event: EventSummary) => void;
};

/**
 * Main event feed list component with search, tabs, and filtering.
 * 
 * Features:
 * - Search bar for filtering by event title
 * - Upcoming/Past tabs with animated underline slider
 * - Tag-based filtering via FilterPanel
 * - Chronological sorting (soonest first for upcoming, most recent first for past)
 */
const EventFeedList = ({ onSelectEvent, events = [] }: EventFeedListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timeWindow, setTimeWindow] = useState<TimeOption>('any');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  /**
   * Predefined tags from constants for the filter panel.
   */
  const allTags = Array.from(EVENT_TAGS).sort((a, b) => a.localeCompare(b));

  /**
   * Filters and sorts events based on current tab, search term, and selected tags.
   * 
   * Logic:
   * 1. Filter by tab (upcoming = future events, past = events that already happened)
   * 2. Filter by search term (case-insensitive title match)
   * 3. Filter by tags (OR logic - event matches if it has ANY selected tag)
   * 4. Sort chronologically (ascending for upcoming, descending for past)
   */
  const filteredEvents = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();
    const nowMs = Date.now();

    const matchesTab = (event: EventSummary) => {
      const startsAtMs = event.startsAt ? new Date(event.startsAt).getTime() : NaN;
      const isPast = Number.isFinite(startsAtMs) ? startsAtMs < nowMs : false;
      return activeTab === 'past' ? isPast : !isPast;
    };

    const matchesSearchAndTags = (event: EventSummary) => {
      const matchesSearch = event.title.toLowerCase().includes(lower);
      const tags = event.tags ?? [];
      // if no tags selected, show all; otherwise, require at least one matching tag
      const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => tags.includes(tag));
      return matchesSearch && matchesTags;
    };

    const base = events.filter((event) => matchesTab(event) && matchesSearchAndTags(event));

    return base.sort((a, b) => {
      const aMs = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const bMs = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      return activeTab === 'past' ? bMs - aMs : aMs - bMs;
    });
  }, [searchTerm, selectedTags, activeTab, events]);

  /**
   * Handles event card selection.
   * Updates local selection state and notifies parent via callback.
   */
  const handleSelect = (event: EventSummary) => {
    setSelectedEventId(event.id);
    onSelectEvent?.(event);
  };

  // Sliding Underline Tab Animation
  const tabsRowRef = useRef<HTMLDivElement | null>(null);
  const upcomingRef = useRef<HTMLButtonElement | null>(null);
  const pastRef = useRef<HTMLButtonElement | null>(null);
  const [sliderStyle, setSliderStyle] = useState<{ width: number; x: number }>({ width: 0, x: 0 });

  // Keep a stable ref to activeTab for use in resize handler
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  /**
   * Calculates and updates the sliding underline position.
   * Measures the active tab button and positions the slider underneath it.
   */
  const syncSlider = (tab: 'upcoming' | 'past' = activeTabRef.current) => {
    const container = tabsRowRef.current;
    const target = (tab === 'upcoming' ? upcomingRef.current : pastRef.current) ?? null;
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setSliderStyle({
      width: targetRect.width,
      x: targetRect.left - containerRect.left,
    });
  };

  // Sync slider position when tab changes (useLayoutEffect for no flicker)
  useLayoutEffect(() => {
    syncSlider(activeTab);
  }, [activeTab]);

  // Re-sync slider on window resize
  useEffect(() => {
    const onResize = () => syncSlider();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /**
   * Toggles a tag in the selected tags array.
   * Adds tag if not present, removes if already selected.
   */
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  /** Resets all filters to their default values. */
  const clearFilters = () => {
    setSelectedTags([]);
    setTimeWindow('any');
    setSortBy('recommended');
  };

  // Count of applied filters for badge display
  const appliedCount = selectedTags.length + (timeWindow !== 'any' ? 1 : 0) + (sortBy !== 'recommended' ? 1 : 0);

  return (
    // Main Container
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-motion-warmWhite p-6 shadow-card">

      {/* Header Section */}
      <header className="space-y-4 pb-4">
        <h2 className="sr-only">{activeTab === 'upcoming' ? 'Upcoming Events' : 'Past Events'}</h2>

        {/* Search Bar Row */}
        <div className="flex items-center gap-3">
          <label htmlFor="feed-search" className="sr-only">
            Search events
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
              id="feed-search"
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
              ref={upcomingRef}
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                'pb-3 text-sm font-semibold transition-colors',
                activeTab === 'upcoming' ? 'text-motion-plum' : 'text-motion-plum/60 hover:text-motion-plum',
              )}
            >
              Upcoming
            </button>
            <button
              ref={pastRef}
              type="button"
              onClick={() => setActiveTab('past')}
              className={cn(
                'pb-3 text-sm font-semibold transition-colors',
                activeTab === 'past' ? 'text-motion-plum' : 'text-motion-plum/60 hover:text-motion-plum',
              )}
            >
              Past
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

      {/* Scrollable Events List */}
      <section className="flex-1 min-h-0 space-y-5 overflow-y-auto px-2 pb-2">
        {filteredEvents.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-motion-plum/70">No events match your search.</p>
        ) : (
          filteredEvents.map((event) => {
            const pastLabel = activeTab === 'past' && event.startsAt
              ? format(parseISO(event.startsAt), 'MMM d, yyyy')
              : null;
            // Override datetime for past events to show formatted date
            const eventForCard: EventSummary = activeTab === 'past' && pastLabel ? { ...event, datetime: pastLabel } : event;

            return (
              <EventCard
                key={event.id}
                event={eventForCard}
                variant="list"
                isActive={selectedEventId === event.id}
                onSelect={() => handleSelect(event)}
              />
            );
          })
        )}
      </section>

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
  );
};

export default EventFeedList;
