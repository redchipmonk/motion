import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EventFeedList from '../components/EventFeedList'
import Map from '../components/Map/Map'
import EventMarker from '../components/Map/EventMarker'
import EventPreviewOverlay from '../components/EventPreviewOverlay'
import { apiClient } from '../lib/apiClient'
import type { EventSummary, EventFeedItem, User } from '../types'
import { useAuth } from '../context/AuthContext'
import { transformEventToSummary } from '../lib/transforms';

const EventsPage = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([47.6558, -122.3268])
  const [searchParams, setSearchParams] = useSearchParams()
  const [now] = useState(() => Date.now())

  // Social Graph State
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [connectionIds, setConnectionIds] = useState<string[]>([])

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        const userProfile = await apiClient.get<User>(`/users/${user._id}`);
        const fIds = (userProfile.following || []).map((u: string | User) => typeof u === 'object' ? u._id : u);
        const cIds = (userProfile.connections || []).map((u: string | User) => typeof u === 'object' ? u._id : u);
        setFollowingIds(fIds);
        setConnectionIds(cIds);

        const lat = 47.6554
        const long = -122.3001
        const radius = 10

        const data = await apiClient.get<EventFeedItem[]>(
          `/events/feed?userId=${user._id}&lat=${lat}&long=${long}&radius=${radius}`
        )

        if (data && data.length > 0) {
          setEvents(data.map(transformEventToSummary))
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
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
              followingIds={followingIds}
              connectionIds={connectionIds}
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
