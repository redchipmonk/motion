import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Marker } from 'react-leaflet'; // Added imports for UserMarker
import L from 'leaflet'; // Added imports for UserMarker
import { renderToStaticMarkup } from 'react-dom/server'; // Added imports for UserMarker
import EventFeedList from '../components/EventFeedList'
import Map from '../components/Map/Map'
import EventMarker from '../components/Map/EventMarker'
import EventPreviewOverlay from '../components/EventPreviewOverlay'
import { apiClient } from '../lib/apiClient'
import type { EventSummary, EventFeedItem, User } from '../types'
import { useAuth } from '../context/AuthContext'
import { transformEventToSummary } from '../lib/transforms';
import { MOCK_USER_LOCATION } from '../data/mockData'; // Import Mock Location

// Custom User Location Icon (Purple, Non-interactive)
const createUserIcon = () => {
  const html = renderToStaticMarkup(
    <div className="box-content h-4 w-4 rounded-full bg-motion-purple border-[3px] border-white shadow-[0_2px_5px_rgba(0,0,0,0.3)] pulse-animation" />
  );

  return L.divIcon({
    html,
    className: 'bg-transparent',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const EventsPage = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([MOCK_USER_LOCATION.lat, MOCK_USER_LOCATION.long])
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null) // Track active tooltip
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
        // REMOVED: setMapCenter call. Map stays where it is (user focus).
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, events])

  const handleBackToMap = () => {
    if (selectedEvent && selectedEvent.location?.coordinates) {
      const [lng, lat] = selectedEvent.location.coordinates
      // Pan to event
      setMapCenter([lat, lng])
      // Trigger tooltip opening
      setActiveTooltipId(selectedEvent.id)
      // Close overlay
      setSelectedEvent(null)
      // Clear URL param
      setSearchParams({})

      // Clear active tooltip after a delay (optional, to allow re-triggering)
      setTimeout(() => setActiveTooltipId(null), 3000)
    } else {
      setSelectedEvent(null)
      setSearchParams({})
    }
  }

  return (
    <section className="relative h-full min-h-0 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Map
          center={mapCenter}
          offsetX={selectedEvent ? 0 : 0.25}
          onClick={() => setActiveTooltipId(null)} // Clear active tooltip on map click
        >
          {/* User Location Marker */}
          <Marker
            position={[MOCK_USER_LOCATION.lat, MOCK_USER_LOCATION.long]}
            icon={createUserIcon()}
            zIndexOffset={2000} // Ensure it's on top of everything
            interactive={false}
          />

          {events
            .filter((event) => {
              if (!event.startsAt) return true // Fallback if no date
              return new Date(event.startsAt).getTime() > now
            })
            .map((event) => {
              if (!event.location?.coordinates) return null
              const [lng, lat] = event.location.coordinates

              let isToday = false;
              if (event.startsAt) {
                const eventDate = new Date(event.startsAt);
                const today = new Date();
                isToday = eventDate.getDate() === today.getDate() &&
                  eventDate.getMonth() === today.getMonth() &&
                  eventDate.getFullYear() === today.getFullYear();
              }

              return (
                <EventMarker
                  key={event.id}
                  event={event}
                  position={[lat, lng]}
                  onClick={(e) => {
                    setSelectedEvent(e)
                    setActiveTooltipId(null)
                  }}
                  onHover={() => setActiveTooltipId(null)} // Clear active tooltip on hover
                  zIndexOffset={isToday ? 1000 : 0} // Prioritize Today events
                  forceOpenTooltip={event.id === activeTooltipId} // Trigger tooltip
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
          onBackToMap={handleBackToMap}
        />
      )}
    </section>
  )
}

export default EventsPage
