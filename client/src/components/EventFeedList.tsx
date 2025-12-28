import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FaFilter } from 'react-icons/fa'
import EventCard from './EventCard'
import { motionTheme, cn } from '../theme'
import { MOCK_EVENTS } from '../data/mockData'
import { FilterPanel, type SortOption, type TimeOption } from './FilterPanel'
import { formatPastDateLabel } from '../utils/dateUtils'
import type { EventSummary } from '../types'

type EventFeedListProps = {
  events?: EventSummary[]
  onSelectEvent?: (event: EventSummary) => void
}

const EventFeedList = ({ onSelectEvent, events = MOCK_EVENTS }: EventFeedListProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id ?? null)

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [timeWindow, setTimeWindow] = useState<TimeOption>('any')
  const [sortBy, setSortBy] = useState<SortOption>('recommended')

  // Tag computation
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    events.forEach((event) => (event.tags ?? []).forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort((a, b) => a.localeCompare(b))
  }, [events])

  // Filtering logic
  const filteredEvents = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase()
    const nowMs = Date.now()

    const matchesTab = (event: EventSummary) => {
      const startsAtMs = event.startsAt ? new Date(event.startsAt).getTime() : NaN
      const isPast = Number.isFinite(startsAtMs) ? startsAtMs < nowMs : false
      return activeTab === 'past' ? isPast : !isPast
    }

    const matchesSearchAndTags = (event: EventSummary) => {
      const matchesSearch = event.title.toLowerCase().includes(lower)
      const tags = event.tags ?? []
      const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => tags.includes(tag))
      return matchesSearch && matchesTags
    }

    const base = events.filter((event) => matchesTab(event) && matchesSearchAndTags(event))

    return base.sort((a, b) => {
      const aMs = a.startsAt ? new Date(a.startsAt).getTime() : 0
      const bMs = b.startsAt ? new Date(b.startsAt).getTime() : 0
      return activeTab === 'past' ? bMs - aMs : aMs - bMs
    })
  }, [searchTerm, selectedTags, activeTab, events])

  const handleSelect = (event: EventSummary) => {
    setSelectedEventId(event.id)
    onSelectEvent?.(event)
  }

  // Sliding underline tabs
  const tabsRowRef = useRef<HTMLDivElement | null>(null)
  const upcomingRef = useRef<HTMLButtonElement | null>(null)
  const pastRef = useRef<HTMLButtonElement | null>(null)
  const [sliderStyle, setSliderStyle] = useState<{ width: number; x: number }>({ width: 0, x: 0 })

  const activeTabRef = useRef(activeTab)
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  const syncSlider = (tab: 'upcoming' | 'past' = activeTabRef.current) => {
    const container = tabsRowRef.current
    const target = (tab === 'upcoming' ? upcomingRef.current : pastRef.current) ?? null
    if (!container || !target) return

    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    setSliderStyle({
      width: targetRect.width,
      x: targetRect.left - containerRect.left,
    })
  }

  useLayoutEffect(() => {
    syncSlider(activeTab)
  }, [activeTab])

  useEffect(() => {
    const onResize = () => syncSlider()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearFilters = () => {
    setSelectedTags([])
    setTimeWindow('any')
    setSortBy('recommended')
  }

  const appliedCount = selectedTags.length + (timeWindow !== 'any' ? 1 : 0) + (sortBy !== 'recommended' ? 1 : 0)

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-motion-warmWhite p-6 shadow-card">
      <header className="space-y-4 pb-4">
        <h2 className="sr-only">{activeTab === 'upcoming' ? 'Upcoming Events' : 'Past Events'}</h2>

        <div className="flex items-center gap-3">
          <label htmlFor="feed-search" className="sr-only">
            Search events
          </label>

          <div
            className={cn(
              'group relative flex-1 rounded-full border bg-white transition-colors',
              motionTheme.borders.authInput,
              motionTheme.shadows.soft,
              motionTheme.states.formFocusBorder,
              motionTheme.shadows.focusWithin,
            )}
          >
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

          <button
            type="button"
            className="relative text-motion-purple"
            aria-label="Open filters"
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <FaFilter size={18} />
            {appliedCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-motion-orange px-1 text-[11px] font-bold text-white">
                {appliedCount}
              </span>
            )}
          </button>
        </div>

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

      <section className="flex-1 min-h-0 space-y-5 overflow-y-auto px-2 pb-2">
        {filteredEvents.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-motion-plum/70">No events match your search.</p>
        ) : (
          filteredEvents.map((event) => {
            const pastLabel = activeTab === 'past' ? formatPastDateLabel(event.startsAt) : null
            const eventForCard: EventSummary = activeTab === 'past' && pastLabel ? { ...event, datetime: pastLabel } : event

            return (
              <EventCard
                key={event.id}
                event={eventForCard}
                variant="list"
                isActive={selectedEventId === event.id}
                onSelect={() => handleSelect(event)}
              />
            )
          })
        )}
      </section>

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
  )
}

export default EventFeedList
