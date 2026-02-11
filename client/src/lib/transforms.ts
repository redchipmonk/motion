import { format } from 'date-fns';
import type { EventFeedItem, EventSummary } from '../types';

/**
 * Transforms a raw EventFeedItem from the API/mock layer into an EventSummary
 * suitable for rendering in cards, feeds, and maps.
 */
export const transformEventToSummary = (event: EventFeedItem): EventSummary => {
  const dateStr = (() => {
    const date = new Date(event.dateTime);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return `Today @ ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d @ h:mm a');
  })();

  const distanceStr = event.distance
    ? `${(event.distance / 1609.34).toFixed(1)} mi`
    : undefined;

  return {
    id: event._id,
    title: event.title,
    host: event.creatorDetails?.name || 'Unknown Host',
    hostId: event.creatorDetails?._id || (typeof event.createdBy === 'string' ? event.createdBy : event.createdBy?._id),
    datetime: dateStr,
    startsAt: event.dateTime,
    distance: distanceStr,
    tags: event.tags || [],
    heroImageUrl: event.images?.[0] || '/placeholder-event.jpg',
    location: {
      coordinates: event.location.coordinates,
      address: event.location.address,
    },
    description: event.description,
  };
};
