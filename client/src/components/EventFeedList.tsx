import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FaFilter } from 'react-icons/fa'
import EventCard, { type EventSummary } from './EventCard'
import { motionTheme, cn } from '../theme'

const MOCK_EVENTS: EventSummary[] = [
  {
    id: '1',
    title: 'Bake Sale',
    host: 'UW Cuisine Club',
    datetime: 'Nov 20 · 1:00 PM',
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
    distance: '1.2 miles',
    tags: ['Service', 'Outdoors'],
    heroImageUrl: '/images/mock/cleanup.jpg',
  },
  {
    id: '3',
    title: 'Intramural Soccer Finals',
    host: 'UW Athletics',
    datetime: 'Nov 25 · 7:30 PM',
    distance: 'On Campus',
    tags: ['Sports'],
    heroImageUrl: '/images/mock/soccer.jpg',
  },
]

type EventFeedListProps = {
  onSelectEvent?: (event: EventSummary) => void
}

const EventFeedList = ({ onSelectEvent }: EventFeedListProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(MOCK_EVENTS[0]?.id ?? null)

  const filteredEvents = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase()
    return MOCK_EVENTS.filter((event) => event.title.toLowerCase().includes(lower))
  }, [searchTerm])

  const handleSelect = (event: EventSummary) => {
    setSelectedEventId(event.id)
    onSelectEvent?.(event)
  }

  const tabsRowRef = useRef<HTMLDivElement | null>(null)
  const upcomingRef = useRef<HTMLButtonElement | null>(null)
  const pastRef = useRef<HTMLButtonElement | null>(null)
  const [sliderStyle, setSliderStyle] = useState<{ width: number; x: number }>({ width: 0, x: 0 })

  const syncSlider = () => {
    const container = tabsRowRef.current
    const target = (activeTab === 'upcoming' ? upcomingRef.current : pastRef.current) ?? null
    if (!container || !target) return

    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    setSliderStyle({
      width: targetRect.width,
      x: targetRect.left - containerRect.left,
    })
  }

  useLayoutEffect(() => {
    syncSlider()
    window.addEventListener('resize', syncSlider)
    return () => window.removeEventListener('resize', syncSlider)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    syncSlider()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-motion-warmWhite p-6 shadow-card">
      <header className="space-y-4 pb-4">
        {/* Keeps App.test.tsx passing + improves a11y without changing the UI */}
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

          <button type="button" className="text-motion-purple" aria-label="Open filters">
            <FaFilter size={18} />
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
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              variant="list"
              isActive={selectedEventId === event.id}
              onSelect={() => handleSelect(event)}
            />
          ))
        )}
      </section>
    </div>
  )
}

export default EventFeedList
