import { format } from 'date-fns';
import type { EventFeedItem, EventSummary } from '../types';

/**
 * Transforms a raw EventFeedItem from the API/mock layer into an EventSummary
 * suitable for rendering in cards, feeds, and maps.
 */
export const transformEventToSummary = (event: EventFeedItem): EventSummary => ({
  id: event._id,
  title: event.title,
  host: event.creatorDetails?.name || 'Unknown Host',
  hostId: event.creatorDetails?._id || (typeof event.createdBy === 'string' ? event.createdBy : event.createdBy?._id),
  datetime: format(new Date(event.dateTime), 'MMM d @ h:mm a'),
  startsAt: event.dateTime,
  distance: event.distance ? `${(event.distance / 1000).toFixed(1)} km` : undefined,
  tags: event.tags || [],
  heroImageUrl: event.images?.[0] || '/placeholder-event.jpg',
  location: {
    coordinates: event.location.coordinates,
    address: event.location.address,
  },
  description: event.description,
});
