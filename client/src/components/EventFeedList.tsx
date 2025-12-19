import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FaFilter } from 'react-icons/fa'
import EventCard, { type EventSummary } from './EventCard'
import { motionTheme, cn } from '../theme'

const MOCK_EVENTS: EventSummary[] = [
  {
    id: '1',
    title: 'Bake Sale',
    host: 'UW Cuisine Club',
    datetime: 'Nov 20 · 1:00 PM',
    startsAt: '2025-11-20T13:00:00-08:00',
    distance: '0.6 miles',
    tags: ['Food'],
    heroImageUrl: '/images/mock/bake-sale.jpg',
    rsvpLabel: 'RSVP',
  },
  {
    id: '2',
    title: 'Campus Clean Up',
    host: 'Eco Huskies',
    datetime: 'Nov 22 · 9:00 AM',
    startsAt: '2025-11-22T09:00:00-08:00',
    distance: '1.2 miles',
    tags: ['Service', 'Outdoors'],
    heroImageUrl: '/images/mock/cleanup.jpg',
  },
  {
    id: '3',
    title: 'Intramural Soccer Finals',
    host: 'UW Athletics',
    datetime: 'Nov 25 · 7:30 PM',
    startsAt: '2025-11-25T19:30:00-08:00',
    distance: 'On Campus',
    tags: ['Sports'],
    heroImageUrl: '/images/mock/soccer.jpg',
  },
  {
    id: '4',
    title: 'Winter Showcase',
    host: 'UW Design Society',
    datetime: 'Dec 3 · 6:30 PM',
    startsAt: '2026-12-03T18:30:00-08:00',
    distance: '0.8 miles',
    tags: ['Arts'],
    heroImageUrl: '/images/mock/bake-sale.jpg',
  },
]

type EventFeedListProps = {
  onSelectEvent?: (event: EventSummary) => void
}

type SortOption = 'recommended' | 'soonest' | 'closest'
type TimeOption = 'any' | 'today' | 'week' | 'month'

const formatPastDateLabel = (startsAt?: string) => {
  if (!startsAt) return null
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const EventFeedList = ({ onSelectEvent }: EventFeedListProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(MOCK_EVENTS[0]?.id ?? null)

  // Filters (UI-first; tags filter is applied, others are placeholders for now)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [timeWindow, setTimeWindow] = useState<TimeOption>('any')
  const [sortBy, setSortBy] = useState<SortOption>('recommended')
  const filterButtonRef = useRef<HTMLButtonElement | null>(null)
  const filtersPanelRef = useRef<HTMLDivElement | null>(null)

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    MOCK_EVENTS.forEach((event) => (event.tags ?? []).forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort((a, b) => a.localeCompare(b))
  }, [])

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

    const base = MOCK_EVENTS.filter((event) => matchesTab(event) && matchesSearchAndTags(event))

    return base.sort((a, b) => {
      const aMs = a.startsAt ? new Date(a.startsAt).getTime() : 0
      const bMs = b.startsAt ? new Date(b.startsAt).getTime() : 0
      return activeTab === 'past' ? bMs - aMs : aMs - bMs
    })
  }, [searchTerm, selectedTags, activeTab])

  const handleSelect = (event: EventSummary) => {
    setSelectedEventId(event.id)
    onSelectEvent?.(event)
  }

  // Sliding underline tabs
  const tabsRowRef = useRef<HTMLDivElement | null>(null)
  const upcomingRef = useRef<HTMLButtonElement | null>(null)
  const pastRef = useRef<HTMLButtonElement | null>(null)
  const [sliderStyle, setSliderStyle] = useState<{ width: number; x: number }>({ width: 0, x: 0 })

  // Keep the latest tab in a ref so the resize listener never goes stale.
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
    // Bind once; handler reads activeTabRef.current so it always stays in sync after resize.
    const onResize = () => syncSlider()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Close filters on escape / outside click
  useEffect(() => {
    if (!filtersOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false)
    }

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      const panel = filtersPanelRef.current
      const button = filterButtonRef.current
      if (panel?.contains(target)) return
      if (button?.contains(target)) return
      setFiltersOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [filtersOpen])

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
            ref={filterButtonRef}
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

      {filtersOpen && (
        <div className="absolute inset-0 z-20">
          <div className="absolute inset-0 bg-motion-plum/10 backdrop-blur-[2px]" />

          <div
            ref={filtersPanelRef}
            role="dialog"
            aria-label="Filters"
            className={cn(
              'absolute right-6 top-[88px] w-[340px] max-w-[calc(100%-48px)] rounded-3xl border bg-white p-5',
              motionTheme.borders.authInput,
              motionTheme.shadows.softLg,
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold text-motion-plum">Filters</p>
                <p className="text-xs text-motion-plum/60">Narrow down events</p>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-full px-3 py-1 text-sm font-semibold text-motion-plum/70 hover:bg-motion-lavender"
                aria-label="Close filters"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-motion-plum">Time</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'any', label: 'Any time' },
                      { id: 'today', label: 'Today' },
                      { id: 'week', label: 'This week' },
                      { id: 'month', label: 'This month' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTimeWindow(opt.id)}
                      className={cn(
                        'rounded-2xl border px-3 py-2 text-sm font-semibold transition',
                        timeWindow === opt.id
                          ? 'border-motion-purple bg-motion-lavender text-motion-plum'
                          : 'border-motion-plum/15 bg-white text-motion-plum/70 hover:border-motion-purple/30',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-motion-plum/50">UI only (wiring date logic later).</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-motion-plum">Tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const active = selectedTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-semibold transition',
                          active
                            ? 'border-motion-purple bg-motion-lavender text-motion-plum'
                            : 'border-motion-plum/15 bg-white text-motion-plum/70 hover:border-motion-purple/30',
                        )}
                        aria-pressed={active}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-motion-plum">Sort</p>
                <div className="mt-2 space-y-2">
                  {(
                    [
                      { id: 'recommended', label: 'Recommended' },
                      { id: 'soonest', label: 'Soonest' },
                      { id: 'closest', label: 'Closest' },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-2xl border bg-white px-3 py-2 transition',
                        motionTheme.borders.authInput,
                        'hover:border-motion-purple/30',
                      )}
                    >
                      <span className="text-sm font-semibold text-motion-plum/80">{opt.label}</span>
                      <input
                        type="radio"
                        name="sort"
                        value={opt.id}
                        checked={sortBy === opt.id}
                        onChange={() => setSortBy(opt.id)}
                        className="h-4 w-4 accent-motion-purple"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-motion-plum/50">UI only (wiring sort logic later).</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full px-4 py-2 text-sm font-semibold text-motion-plum/70 hover:bg-motion-lavender"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className={cn(
                  'rounded-full border-2 border-transparent bg-motion-yellow px-5 py-2 text-sm font-bold transition',
                  motionTheme.text.accent,
                  motionTheme.shadows.soft,
                  motionTheme.states.primaryHoverBorder,
                  motionTheme.states.primaryActiveBg,
                  motionTheme.states.primaryActiveText,
                )}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventFeedList
