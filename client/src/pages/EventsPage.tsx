import { useEffect, useState } from 'react'
import EventFeedList from '../components/EventFeedList'
import { MOCK_EVENTS } from '../data/mockData'
import Map from '../components/Map/Map'
import EventMarker from '../components/Map/EventMarker'
import { api } from '../lib/api'
import type { EventSummary } from '../components/EventCard'

const EventsPage = () => {
  const [events, setEvents] = useState<EventSummary[]>(MOCK_EVENTS)
  // Capture "now" at mount/render time purely
  const [now] = useState(() => Date.now())

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Attempt to fetch real events
        // Note: We might need to map backend response to EventSummary if shapes differ.
        // Assuming the API returns an array of events compatible with our types for now.
        const data = await api.get<{ events: EventSummary[] } | EventSummary[]>('/events/feed')

        // Handle various response structures
        const list = Array.isArray(data) ? data : (data as { events: EventSummary[] }).events

        if (list && list.length > 0) {
          setEvents(list)
        }
      } catch (error) {
        console.warn('Failed to fetch events, using mock data:', error)
      }
    }

    fetchEvents()
  }, [])

  return (
    <section className="relative h-full min-h-0 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Map>
          {events
            .filter((event) => {
              if (!event.startsAt) return true // Fallback if no date
              return new Date(event.startsAt).getTime() > now
            })
            .map((event) => {
              if (!event.location?.coordinates) return null
              // GeoJSON is [long, lat], Leaflet needs [lat, long]
              const [lng, lat] = event.location.coordinates
              return (
                <EventMarker
                  key={event.id}
                  event={event}
                  position={[lat, lng]}
                />
              )
            })}
        </Map>
      </div>

      <div className="absolute inset-y-0 left-0 w-1/2 min-h-0">
        <div className="h-full pointer-events-auto">
          <EventFeedList events={events} />
        </div>
      </div>
    </section>
  )
}

export default EventsPage
