/**
 * @file Main events discovery page with map and feed.
 * 
 * Displays an interactive map with event markers and a scrollable feed.
 * Clicking an event shows a preview overlay. Uses mock data as fallback
 * when API is unavailable.
 * 
 * @example
 * // Route: /events or /
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EventFeedList from '../components/EventFeedList'
import { MOCK_EVENTS } from '../data/mockData'
import Map from '../components/Map/Map'
import EventMarker from '../components/Map/EventMarker'
import EventPreviewOverlay from '../components/EventPreviewOverlay'
import { api } from '../lib/api'
import type { EventSummary, EventFeedItem } from '../types'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns';

const transformEvent = (event: EventFeedItem): EventSummary => ({
  id: event._id,
  title: event.title,
  host: event.creatorDetails?.name || 'Unknown Host',
  datetime: format(new Date(event.dateTime), 'MMM d @ h:mm a'),
  startsAt: event.dateTime,
  distance: event.distance ? `${(event.distance / 1000).toFixed(1)} km` : undefined,
  tags: event.tags || [],
  heroImageUrl: event.images?.[0] || '/placeholder-event.jpg',
  location: {
    coordinates: event.location.coordinates,
    address: event.location.address
  },
  description: event.description
});

const EventsPage = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventSummary[]>(() => MOCK_EVENTS.map(transformEvent)) // Initialize with transformed mock data
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([47.6558, -122.3268])
  const [searchParams, setSearchParams] = useSearchParams()
  // Capture "now" at mount/render time purely
  const [now] = useState(() => Date.now())

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        console.warn('User not authenticated, using mock data')
        setEvents(MOCK_EVENTS.map(transformEvent))
        return
      }

      try {
        // UW (University of Washington) Seattle campus coordinates
        const lat = 47.6554
        const long = -122.3001
        const radius = 10 // km

        const data = await api.get<EventFeedItem[]>(
          `/events/feed?userId=${user._id}&lat=${lat}&long=${long}&radius=${radius}`
        )

        console.log('Raw API response:', data)

        // Transform backend response to EventSummary format
        if (data && data.length > 0) {
          const transformedEvents = data.map(transformEvent)
          console.log('Transformed events:', transformedEvents)
          setEvents(transformedEvents)
        } else {
          console.log('No events returned from API')
        }
      } catch (error) {
        console.warn('Failed to fetch events, using mock data:', error)
        setEvents(MOCK_EVENTS.map(transformEvent))
      }
    }

    fetchEvents()
  }, [user])

  // Handle URL query params for direct event navigation
  useEffect(() => {
    const eventIdParam = searchParams.get('eventId')
    if (eventIdParam && events.length > 0) {
      const targetEvent = events.find(e => e.id === eventIdParam)
      // Only update if targeting a different event to avoid loops/redundant renders
      if (targetEvent && selectedEvent?.id !== targetEvent.id) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedEvent(targetEvent)
        if (targetEvent.location?.coordinates) {
          // GeoJSON is [long, lat], Leaflet needs [lat, long]
          const [lng, lat] = targetEvent.location.coordinates
          // Apply offset to center map visually (accounting for UI overlay)
          // Shifting longitude slightly West moves the map center West, 
          // which moves the actual point East (Right) on the screen.
          setMapCenter([lat, lng - 0.01])
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, events])

  return (
    <section className="relative h-full min-h-0 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Map center={mapCenter}>
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
                  onClick={setSelectedEvent}
                />
              )
            })}
        </Map>
      </div>

      {!selectedEvent && (
        <div className="absolute inset-y-0 left-0 w-1/2 min-h-0">
          <div className="h-full pointer-events-auto">
            <EventFeedList
              events={events}
              onSelectEvent={setSelectedEvent}
            />
          </div>
        </div>
      )}

      {selectedEvent && (
        <EventPreviewOverlay
          event={selectedEvent}
          onClose={() => {
            setSelectedEvent(null)
            setSearchParams({}) // Clear URL params to prevent re-opening
          }}
        />
      )}
    </section>
  )
}

export default EventsPage
